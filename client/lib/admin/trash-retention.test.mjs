import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TRASH_MIN_ITEMS,
  DEFAULT_TRASH_RETENTION_DAYS,
  planTrashedPageCleanup,
  resolveTrashRetentionPolicy,
} from "./trash-retention.mjs";

function createEntry(entryId, deletedAt, overrides = {}) {
  return {
    entryId,
    resource: { id: entryId },
    metadata: {
      resourceType: "dynamic-page",
      resourceId: entryId,
      deletedAt,
    },
    ...overrides,
  };
}

test("çöp kutusu politikası varsayılan ve yapılandırılmış değerleri çözer", () => {
  assert.deepEqual(resolveTrashRetentionPolicy({}), {
    retentionDays: DEFAULT_TRASH_RETENTION_DAYS,
    minimumItems: DEFAULT_TRASH_MIN_ITEMS,
  });
  assert.deepEqual(
    resolveTrashRetentionPolicy({
      PANEL_TRASH_RETENTION_DAYS: "30",
      PANEL_TRASH_MIN_ITEMS: "5",
    }),
    { retentionDays: 30, minimumItems: 5 }
  );
});

test("geçersiz saklama ayarlarını temizliğe başlamadan reddeder", () => {
  assert.throws(
    () => resolveTrashRetentionPolicy({ PANEL_TRASH_RETENTION_DAYS: "0" }),
    /PANEL_TRASH_RETENTION_DAYS/
  );
  assert.throws(
    () => resolveTrashRetentionPolicy({ PANEL_TRASH_MIN_ITEMS: "1.5" }),
    /PANEL_TRASH_MIN_ITEMS/
  );
});

test("süresi dolsa bile en yeni kayıtların asgari sayısını korur", () => {
  const entries = Array.from({ length: 25 }, (_, index) =>
    createEntry(
      `page-${String(index).padStart(2, "0")}`,
      new Date(Date.UTC(2026, 0, 25 - index)).toISOString()
    )
  );

  const plan = planTrashedPageCleanup(entries, {
    now: new Date("2026-09-10T00:00:00.000Z"),
    retentionDays: 90,
    minimumItems: 20,
  });

  assert.equal(plan.protectedEntries.length, 20);
  assert.deepEqual(
    plan.candidates.map((entry) => entry.entryId),
    ["page-20", "page-21", "page-22", "page-23", "page-24"]
  );
});

test("yeni ve doğrulanamayan kayıtları otomatik silme dışında bırakır", () => {
  const plan = planTrashedPageCleanup(
    [
      createEntry("recent", "2026-09-01T00:00:00.000Z"),
      createEntry("expired", "2026-01-01T00:00:00.000Z"),
      createEntry("invalid", "geçersiz-tarih"),
    ],
    {
      now: new Date("2026-09-10T00:00:00.000Z"),
      retentionDays: 90,
      minimumItems: 0,
    }
  );

  assert.deepEqual(plan.candidates.map((entry) => entry.entryId), ["expired"]);
  assert.deepEqual(plan.retainedByAge.map((entry) => entry.entryId), ["recent"]);
  assert.deepEqual(plan.skippedEntries, ["invalid"]);
});
