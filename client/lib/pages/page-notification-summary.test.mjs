import assert from "node:assert/strict";
import test from "node:test";
import { createPageNotificationSummary } from "./page-notification-summary.mjs";

function createRecord(id, { title = "", updatedAt, published = false } = {}) {
  return {
    id,
    updatedAt,
    draft: {
      updatedAt,
      hero: { translations: { tr: { title } } },
    },
    published: published ? { id } : null,
  };
}

test("yalnızca yayınlanmamış sayfaları güncelleme tarihine göre özetler", () => {
  const summary = createPageNotificationSummary([
    createRecord("older", {
      title: "Eski taslak",
      updatedAt: "2026-01-01T10:00:00.000Z",
    }),
    createRecord("published", {
      title: "Yayındaki sayfa",
      updatedAt: "2026-01-03T10:00:00.000Z",
      published: true,
    }),
    createRecord("newer", {
      title: "Yeni taslak",
      updatedAt: "2026-01-02T10:00:00.000Z",
    }),
  ]);

  assert.equal(summary.draftCount, 2);
  assert.deepEqual(summary.drafts, [
    {
      id: "newer",
      title: "Yeni taslak",
      updatedAt: "2026-01-02T10:00:00.000Z",
    },
    {
      id: "older",
      title: "Eski taslak",
      updatedAt: "2026-01-01T10:00:00.000Z",
    },
  ]);
});

test("toplam sayıyı korurken dönen kayıtları limite göre sınırlar", () => {
  const records = Array.from({ length: 8 }, (_, index) =>
    createRecord(`draft-${index}`, {
      title: `Taslak ${index}`,
      updatedAt: `2026-01-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
    })
  );
  const summary = createPageNotificationSummary(records, { limit: 3 });

  assert.equal(summary.draftCount, 8);
  assert.equal(summary.drafts.length, 3);
  assert.equal(summary.drafts[0].id, "draft-7");
});

test("başlığı olmayan sayfa için güvenli varsayılan kullanır", () => {
  const summary = createPageNotificationSummary([
    createRecord("untitled", { updatedAt: "2026-01-01T10:00:00.000Z" }),
  ]);

  assert.equal(summary.drafts[0].title, "Başlıksız sayfa");
});
