import { cp, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolvePanelDataPaths } from "./data-paths.mjs";

export class PanelUploadsMigrationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PanelUploadsMigrationError";
  }
}

async function pathStatus(targetPath) {
  try {
    return await stat(targetPath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function isInsidePath(parentPath, candidatePath) {
  const relativePath = path.relative(parentPath, candidatePath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== ".." &&
      !path.isAbsolute(relativePath))
  );
}

async function summarizeDirectory(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  let fileCount = 0;
  let totalBytes = 0;

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      const summary = await summarizeDirectory(entryPath);
      fileCount += summary.fileCount;
      totalBytes += summary.totalBytes;
      continue;
    }

    if (!entry.isFile()) {
      throw new PanelUploadsMigrationError(
        `Desteklenmeyen upload girdisi bulundu: ${entryPath}`
      );
    }

    const entryStat = await stat(entryPath);
    fileCount += 1;
    totalBytes += entryStat.size;
  }

  return { fileCount, totalBytes };
}

export async function inspectInitialPanelUploadsMigration({
  appRoot,
  uploadsRoot,
}) {
  const paths = resolvePanelDataPaths({ appRoot, uploadsRoot });

  if (!paths.usesPersistentUploadsRoot) {
    throw new PanelUploadsMigrationError(
      "PANEL_UPLOADS_ROOT tanımlanmadan kalıcı uploads dizini hazırlanamaz."
    );
  }

  if (isInsidePath(paths.appRoot, paths.uploadsRoot)) {
    throw new PanelUploadsMigrationError(
      "PANEL_UPLOADS_ROOT proje dizininin dışında kalıcı bir konum olmalıdır."
    );
  }

  const sourceRoot = path.join(paths.appRoot, "public", "uploads");
  const sourceStat = await pathStatus(sourceRoot);

  if (!sourceStat?.isDirectory()) {
    throw new PanelUploadsMigrationError(
      `Kaynak uploads dizini bulunamadı: ${sourceRoot}`
    );
  }

  const targetStat = await pathStatus(paths.uploadsRoot);
  if (targetStat && !targetStat.isDirectory()) {
    throw new PanelUploadsMigrationError(
      `PANEL_UPLOADS_ROOT bir klasör olmalıdır: ${paths.uploadsRoot}`
    );
  }

  const targetEntries = targetStat ? await readdir(paths.uploadsRoot) : [];
  if (targetEntries.length > 0) {
    throw new PanelUploadsMigrationError(
      `Hedef uploads dizini boş değil; mevcut dosyaların üzerine yazılmadı: ${paths.uploadsRoot}`
    );
  }

  return {
    appRoot: paths.appRoot,
    sourceRoot,
    uploadsRoot: paths.uploadsRoot,
    targetExists: Boolean(targetStat),
    summary: await summarizeDirectory(sourceRoot),
  };
}

export async function applyInitialPanelUploadsMigration(options) {
  const plan = await inspectInitialPanelUploadsMigration(options);
  const stagingDirectory = path.join(
    plan.uploadsRoot,
    `.panel-uploads-init-${randomUUID()}`
  );
  const movedEntries = [];

  await mkdir(plan.uploadsRoot, { recursive: true });

  try {
    await cp(plan.sourceRoot, stagingDirectory, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });

    const copiedSummary = await summarizeDirectory(stagingDirectory);
    if (
      copiedSummary.fileCount !== plan.summary.fileCount ||
      copiedSummary.totalBytes !== plan.summary.totalBytes
    ) {
      throw new PanelUploadsMigrationError(
        "Kopyalanan uploads dizini kaynakla eşleşmiyor; geçiş uygulanmadı."
      );
    }

    const entries = await readdir(stagingDirectory);
    for (const entryName of entries) {
      await rename(
        path.join(stagingDirectory, entryName),
        path.join(plan.uploadsRoot, entryName)
      );
      movedEntries.push(entryName);
    }

    return plan;
  } catch (error) {
    for (const entryName of movedEntries.reverse()) {
      await rename(
        path.join(plan.uploadsRoot, entryName),
        path.join(stagingDirectory, entryName)
      ).catch(() => {});
    }
    throw error;
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}
