import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyTrashedPageCleanup,
  inspectTrashedPageCleanup,
} from "../lib/admin/trash-cleanup.mjs";
import { resolvePanelDataPaths } from "../lib/admin/data-paths.mjs";
import { resolveTrashRetentionPolicy } from "../lib/admin/trash-retention.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shouldApply = process.argv.includes("--apply");
const unknownArguments = process.argv
  .slice(2)
  .filter((argument) => argument !== "--apply");

if (unknownArguments.length > 0) {
  console.error(`Bilinmeyen argüman: ${unknownArguments.join(", ")}`);
  process.exit(1);
}

try {
  const paths = resolvePanelDataPaths({
    appRoot,
    dataRoot: process.env.PANEL_DATA_ROOT,
  });
  const policy = resolveTrashRetentionPolicy(process.env);
  const result = shouldApply
    ? await applyTrashedPageCleanup({ trashRoot: paths.trashRoot, policy })
    : await inspectTrashedPageCleanup({ trashRoot: paths.trashRoot, policy });

  console.log(`Çöp kutusu: ${paths.trashRoot}`);
  console.log(`Saklama süresi: ${result.retentionDays} gün`);
  console.log(`Daima korunacak en yeni kayıt: ${result.minimumItems}`);
  console.log(`İncelenen kayıt: ${result.totalEntries}`);
  console.log(`Temizleme adayı: ${result.candidates.length}`);

  if (result.skippedEntries.length > 0) {
    console.log(
      `Güvenlik nedeniyle atlanan kayıt: ${result.skippedEntries.join(", ")}`
    );
  }

  if (shouldApply) {
    console.log(`Kalıcı olarak temizlenen kayıt: ${result.deletedEntries.length}`);

    if (result.changedEntries.length > 0) {
      console.log(
        `Planlamadan sonra değiştiği için korunan kayıt: ${result.changedEntries.join(", ")}`
      );
    }
  } else {
    console.log("Ön izleme tamamlandı; hiçbir kayıt silinmedi.");
    console.log("Temizliği uygulamak için aynı komutu --apply ile çalıştırın.");
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
