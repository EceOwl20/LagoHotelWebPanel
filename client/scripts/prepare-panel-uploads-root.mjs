import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyInitialPanelUploadsMigration,
  inspectInitialPanelUploadsMigration,
} from "../lib/admin/panel-uploads-migration.mjs";

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
  const options = {
    appRoot,
    uploadsRoot: process.env.PANEL_UPLOADS_ROOT,
  };
  const plan = shouldApply
    ? await applyInitialPanelUploadsMigration(options)
    : await inspectInitialPanelUploadsMigration(options);

  console.log(`Kaynak uploads: ${plan.sourceRoot}`);
  console.log(`Kalıcı hedef: ${plan.uploadsRoot}`);
  console.log(
    `Toplam: ${plan.summary.fileCount} dosya, ${plan.summary.totalBytes} bayt`
  );

  if (shouldApply) {
    console.log("Kalıcı uploads dizini başarıyla hazırlandı.");
  } else {
    console.log("Ön izleme tamamlandı; hiçbir dosya değiştirilmedi.");
    console.log("Kopyalamak için aynı komutu --apply ile çalıştırın.");
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
