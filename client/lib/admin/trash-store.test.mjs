import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  listJsonTrashEntries,
  moveJsonFileToTrash,
  removeJsonTrashEntry,
  restoreJsonTrashEntry,
  TrashStoreError,
} from "./trash-store.mjs";

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

test("JSON kaydını içeriğini değiştirmeden çöp kutusuna taşır", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-store-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const sourcePath = path.join(root, "content", "pages", "page-id.json");
  const trashEntryDirectory = path.join(root, "trash", "pages", "page-id");
  const originalContent = '{\n  "id": "page-id",\n  "title": "Spa"\n}\n';
  const metadata = {
    schemaVersion: 1,
    resourceType: "dynamic-page",
    resourceId: "page-id",
    deletedAt: "2026-09-10T12:00:00.000Z",
  };

  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, originalContent);

  const result = await moveJsonFileToTrash({
    sourcePath,
    trashEntryDirectory,
    metadata,
  });

  assert.equal(await pathExists(sourcePath), false);
  assert.equal(await readFile(result.resourcePath, "utf8"), originalContent);
  assert.deepEqual(JSON.parse(await readFile(result.metadataPath, "utf8")), metadata);
});

test("var olan çöp kaydının üzerine yazmaz ve aktif içeriği korur", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-store-conflict-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const sourcePath = path.join(root, "content", "pages", "page-id.json");
  const trashEntryDirectory = path.join(root, "trash", "pages", "page-id");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await mkdir(trashEntryDirectory, { recursive: true });
  await writeFile(sourcePath, '{"version":"active"}\n');
  await writeFile(path.join(trashEntryDirectory, "resource.json"), '{"version":"trash"}\n');

  await assert.rejects(
    moveJsonFileToTrash({ sourcePath, trashEntryDirectory, metadata: {} }),
    (error) =>
      error instanceof TrashStoreError && error.code === "TRASH_ENTRY_EXISTS"
  );

  assert.equal(await readFile(sourcePath, "utf8"), '{"version":"active"}\n');
  assert.equal(
    await readFile(path.join(trashEntryDirectory, "resource.json"), "utf8"),
    '{"version":"trash"}\n'
  );
});

test("geçersiz meta veri kaynak dosya taşınmadan reddedilir", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-store-invalid-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const sourcePath = path.join(root, "page.json");
  await writeFile(sourcePath, '{"id":"page-id"}\n');

  await assert.rejects(
    moveJsonFileToTrash({
      sourcePath,
      trashEntryDirectory: path.join(root, "trash", "page-id"),
      metadata: { invalid: 1n },
    }),
    TypeError
  );

  assert.equal(await pathExists(sourcePath), true);
});

test("çöp kayıtlarını sıralı listeler ve eksik meta veriyi güvenle karşılar", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-store-list-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const trashDirectory = path.join(root, "trash", "pages");
  await mkdir(path.join(trashDirectory, "page-b"), { recursive: true });
  await mkdir(path.join(trashDirectory, "page-a"), { recursive: true });
  await writeFile(path.join(trashDirectory, "ignored.json"), "{}\n");
  await writeFile(
    path.join(trashDirectory, "page-a", "resource.json"),
    '{"id":"page-a"}\n'
  );
  await writeFile(
    path.join(trashDirectory, "page-a", "deletion.json"),
    '{"deletedAt":"2026-09-10T12:00:00.000Z"}\n'
  );
  await writeFile(
    path.join(trashDirectory, "page-b", "resource.json"),
    '{"id":"page-b"}\n'
  );

  const entries = await listJsonTrashEntries(trashDirectory);

  assert.deepEqual(entries, [
    {
      entryId: "page-a",
      resource: { id: "page-a" },
      metadata: { deletedAt: "2026-09-10T12:00:00.000Z" },
    },
    {
      entryId: "page-b",
      resource: { id: "page-b" },
      metadata: null,
    },
  ]);
});

test("çöp kaydını verilen güvenli içerikle aktif konuma geri yükler", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-store-restore-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const trashEntryDirectory = path.join(root, "trash", "pages", "page-id");
  const targetPath = path.join(root, "content", "pages", "page-id.json");
  await mkdir(trashEntryDirectory, { recursive: true });
  await writeFile(
    path.join(trashEntryDirectory, "resource.json"),
    '{"id":"page-id","published":true}\n'
  );

  const restoredResource = { id: "page-id", published: null, status: "draft" };
  await restoreJsonTrashEntry({
    trashEntryDirectory,
    targetPath,
    resource: restoredResource,
  });

  assert.deepEqual(JSON.parse(await readFile(targetPath, "utf8")), restoredResource);
  assert.equal(await pathExists(trashEntryDirectory), false);
});

test("aktif hedef varsa geri yükleme hiçbir kaydın üzerine yazmaz", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-restore-conflict-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const trashEntryDirectory = path.join(root, "trash", "pages", "page-id");
  const targetPath = path.join(root, "content", "pages", "page-id.json");
  await mkdir(trashEntryDirectory, { recursive: true });
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(path.join(trashEntryDirectory, "resource.json"), '{"state":"trash"}\n');
  await writeFile(targetPath, '{"state":"active"}\n');

  await assert.rejects(
    restoreJsonTrashEntry({
      trashEntryDirectory,
      targetPath,
      resource: { state: "restored" },
    }),
    (error) =>
      error instanceof TrashStoreError && error.code === "RESTORE_TARGET_EXISTS"
  );

  assert.equal(await readFile(targetPath, "utf8"), '{"state":"active"}\n');
  assert.equal(
    await readFile(path.join(trashEntryDirectory, "resource.json"), "utf8"),
    '{"state":"trash"}\n'
  );
});

test("kalıcı silmede yalnızca hedeflenen çöp kaydını kaldırır", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "lago-trash-remove-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const targetDirectory = path.join(root, "trash", "pages", "page-a");
  const siblingDirectory = path.join(root, "trash", "pages", "page-b");
  await mkdir(targetDirectory, { recursive: true });
  await mkdir(siblingDirectory, { recursive: true });
  await writeFile(path.join(targetDirectory, "resource.json"), "{}\n");
  await writeFile(path.join(siblingDirectory, "resource.json"), "{}\n");

  await removeJsonTrashEntry(targetDirectory);

  assert.equal(await pathExists(targetDirectory), false);
  assert.equal(await pathExists(siblingDirectory), true);
});
