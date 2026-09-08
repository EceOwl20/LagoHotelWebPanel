import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyInitialPanelDataMigration,
  inspectInitialPanelDataMigration,
} from "../lib/admin/panel-data-migration.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shouldApply = process.argv.includes("--apply");
const unknownArguments = process.argv.slice(2).filter((argument) => argument !== "--apply");

if (unknownArguments.length > 0) {
  console.error(`Bilinmeyen argüman: ${unknownArguments.join(", ")}`);
  process.exit(1);
}

try {
  const options = { appRoot, dataRoot: process.env.PANEL_DATA_ROOT };
  const plan = shouldApply
    ? await applyInitialPanelDataMigration(options)
    : await inspectInitialPanelDataMigration(options);

  console.log(`Kaynak proje: ${plan.appRoot}`);
  console.log(`Kalıcı hedef: ${plan.dataRoot}`);
  console.log(
    `content: ${plan.directorySummaries.content.fileCount} dosya, ${plan.directorySummaries.content.totalBytes} bayt`
  );
  console.log(
    `messages: ${plan.directorySummaries.messages.fileCount} dosya, ${plan.directorySummaries.messages.totalBytes} bayt`
  );

  if (shouldApply) {
    console.log("Kalıcı veri dizini başarıyla hazırlandı.");
  } else {
    console.log("Ön izleme tamamlandı; hiçbir dosya değiştirilmedi.");
    console.log("Kopyalamak için aynı komutu --apply ile çalıştırın.");
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
