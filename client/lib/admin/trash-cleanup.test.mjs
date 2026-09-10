import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyTrashedPageCleanup,
  inspectTrashedPageCleanup,
} from "./trash-cleanup.mjs";

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function createTrashEntry(trashRoot, id, deletedAt) {
  const entryDirectory = path.join(trashRoot, "pages", id);
  await mkdir(entryDirectory, { recursive: true });
  await writeFile(
    path.join(entryDirectory, "resource.json"),
    `${JSON.stringify({ id })}\n`
  );
  await writeFile(
    path.join(entryDirectory, "deletion.json"),
    `${JSON.stringify({
      resourceType: "dynamic-page",
      resourceId: id,
      deletedAt,
    })}\n`
  );
  return entryDirectory;
}

test("ön izleme adayları raporlar fakat çöp kayıtlarını değiştirmez", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-preview-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const entryDirectory = await createTrashEntry(
    root,
    "expired",
    "2026-01-01T00:00:00.000Z"
  );

  const plan = await inspectTrashedPageCleanup({
    trashRoot: root,
    policy: { retentionDays: 90, minimumItems: 0 },
    now: new Date("2026-09-10T00:00:00.000Z"),
  });

  assert.deepEqual(plan.candidates.map((entry) => entry.entryId), ["expired"]);
  assert.equal(await pathExists(entryDirectory), true);
});

test("uygulama yalnızca süresi dolan ve asgari korumanın dışındaki kayıtları siler", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-cleanup-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const newestOldEntry = await createTrashEntry(
    root,
    "newest-old",
    "2026-01-03T00:00:00.000Z"
  );
  const expiredEntry = await createTrashEntry(
    root,
    "expired",
    "2026-01-02T00:00:00.000Z"
  );
  const olderExpiredEntry = await createTrashEntry(
    root,
    "older-expired",
    "2026-01-01T00:00:00.000Z"
  );

  const result = await applyTrashedPageCleanup({
    trashRoot: root,
    policy: { retentionDays: 90, minimumItems: 1 },
    now: new Date("2026-09-10T00:00:00.000Z"),
  });

  assert.deepEqual(result.deletedEntries, ["expired", "older-expired"]);
  assert.equal(await pathExists(newestOldEntry), true);
  assert.equal(await pathExists(expiredEntry), false);
  assert.equal(await pathExists(olderExpiredEntry), false);
});
