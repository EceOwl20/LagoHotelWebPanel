import { randomUUID } from "node:crypto";
import { rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

function createTemporaryPath(filePath) {
  const directory = path.dirname(filePath);
  const fileName = path.basename(filePath);
  return path.join(directory, `.${fileName}.${process.pid}-${randomUUID()}.tmp`);
}

export async function writeFileAtomically(filePath, contents, options) {
  const temporaryPath = createTemporaryPath(filePath);

  try {
    await writeFile(temporaryPath, contents, options);
    await rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await rm(temporaryPath, { force: true });
    } catch {
      // Temizlik hatası asıl yazma hatasını gizlememeli.
    }

    throw error;
  }
}
