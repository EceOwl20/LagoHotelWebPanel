import { mkdir, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { writeFileAtomically } from "./atomic-file.mjs";

export class TrashStoreError extends Error {
  constructor(message, code = "TRASH_STORE_ERROR") {
    super(message);
    this.name = "TrashStoreError";
    this.code = code;
  }
}

function serializeJson(value, errorMessage) {
  const serialized = JSON.stringify(value, null, 2);

  if (serialized === undefined) {
    throw new TypeError(errorMessage);
  }

  return `${serialized}\n`;
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function readJsonTrashEntry(trashEntryDirectory) {
  return {
    resource: await readJsonIfExists(path.join(trashEntryDirectory, "resource.json")),
    metadata: await readJsonIfExists(path.join(trashEntryDirectory, "deletion.json")),
  };
}

export async function listJsonTrashEntries(trashDirectory) {
  await mkdir(trashDirectory, { recursive: true });
  const entries = await readdir(trashDirectory, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  return Promise.all(
    directories.map(async (entry) => {
      const entryDirectory = path.join(trashDirectory, entry.name);

      return { entryId: entry.name, ...(await readJsonTrashEntry(entryDirectory)) };
    })
  );
}

export async function restoreJsonTrashEntry({
  trashEntryDirectory,
  targetPath,
  resource,
}) {
  const serializedResource = serializeJson(
    resource,
    "Geri yüklenecek içerik undefined olamaz."
  );

  if (await pathExists(targetPath)) {
    throw new TrashStoreError(
      "Aynı kimliğe sahip aktif bir içerik zaten bulunuyor.",
      "RESTORE_TARGET_EXISTS"
    );
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFileAtomically(targetPath, serializedResource, "utf8");

  try {
    await rm(trashEntryDirectory, { recursive: true });
  } catch (error) {
    try {
      await rm(targetPath, { force: true });
    } catch {
      // Her iki kopya da veri kaybından daha güvenlidir; sonraki işlem çakışmayı bildirir.
    }

    throw error;
  }

  return targetPath;
}

export async function removeJsonTrashEntry(trashEntryDirectory) {
  if (!(await pathExists(trashEntryDirectory))) {
    throw new TrashStoreError(
      "Çöp kutusu kaydı bulunamadı.",
      "TRASH_ENTRY_NOT_FOUND"
    );
  }

  await rm(trashEntryDirectory, { recursive: true });
}

export async function moveJsonFileToTrash({
  sourcePath,
  trashEntryDirectory,
  metadata,
}) {
  const resourcePath = path.join(trashEntryDirectory, "resource.json");
  const metadataPath = path.join(trashEntryDirectory, "deletion.json");
  const serializedMetadata = serializeJson(
    metadata,
    "Çöp kutusu meta verisi undefined olamaz."
  );

  await mkdir(path.dirname(trashEntryDirectory), { recursive: true });

  try {
    await mkdir(trashEntryDirectory);
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new TrashStoreError(
        "Bu içerik için çöp kutusunda zaten bir kayıt bulunuyor.",
        "TRASH_ENTRY_EXISTS"
      );
    }

    throw error;
  }

  let resourceMoved = false;

  try {
    await rename(sourcePath, resourcePath);
    resourceMoved = true;
    await writeFileAtomically(metadataPath, serializedMetadata, "utf8");
  } catch (error) {
    let rollbackSucceeded = !resourceMoved;

    if (resourceMoved) {
      try {
        await rename(resourcePath, sourcePath);
        rollbackSucceeded = true;
      } catch {
        // Kaynak geri alınamıyorsa çöp kaydı veri kaybını önlemek için korunur.
      }
    }

    if (rollbackSucceeded) {
      await rm(trashEntryDirectory, { recursive: true, force: true }).catch(() => {});
    }

    throw error;
  }

  return { resourcePath, metadataPath };
}
