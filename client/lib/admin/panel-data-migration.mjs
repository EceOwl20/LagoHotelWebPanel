import { cp, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolvePanelDataPaths } from "./data-paths.mjs";

const REQUIRED_DIRECTORIES = ["content", "messages"];

export class PanelDataMigrationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PanelDataMigrationError";
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
      throw new PanelDataMigrationError(
        `Desteklenmeyen kaynak girdisi bulundu: ${entryPath}`
      );
    }

    const entryStat = await stat(entryPath);
    fileCount += 1;
    totalBytes += entryStat.size;
  }

  return { fileCount, totalBytes };
}

export async function inspectInitialPanelDataMigration({ appRoot, dataRoot }) {
  const paths = resolvePanelDataPaths({ appRoot, dataRoot });

  if (!paths.dataRoot) {
    throw new PanelDataMigrationError(
      "PANEL_DATA_ROOT tanımlanmadan kalıcı veri dizini hazırlanamaz."
    );
  }

  if (isInsidePath(paths.appRoot, paths.dataRoot)) {
    throw new PanelDataMigrationError(
      "PANEL_DATA_ROOT proje dizininin dışında kalıcı bir konum olmalıdır."
    );
  }

  const sourceDirectories = Object.fromEntries(
    REQUIRED_DIRECTORIES.map((directoryName) => [
      directoryName,
      path.join(paths.appRoot, directoryName),
    ])
  );

  for (const sourcePath of Object.values(sourceDirectories)) {
    const sourceStat = await pathStatus(sourcePath);
    if (!sourceStat?.isDirectory()) {
      throw new PanelDataMigrationError(`Kaynak dizin bulunamadı: ${sourcePath}`);
    }
  }

  const targetStat = await pathStatus(paths.dataRoot);
  if (targetStat && !targetStat.isDirectory()) {
    throw new PanelDataMigrationError(
      `PANEL_DATA_ROOT bir klasör olmalıdır: ${paths.dataRoot}`
    );
  }

  const targetEntries = targetStat ? await readdir(paths.dataRoot) : [];
  if (targetEntries.length > 0) {
    throw new PanelDataMigrationError(
      `Hedef dizin boş değil; mevcut verilerin üzerine yazılmadı: ${paths.dataRoot}`
    );
  }

  const directorySummaries = {};
  for (const directoryName of REQUIRED_DIRECTORIES) {
    directorySummaries[directoryName] = await summarizeDirectory(
      sourceDirectories[directoryName]
    );
  }

  return {
    appRoot: paths.appRoot,
    dataRoot: paths.dataRoot,
    targetExists: Boolean(targetStat),
    sourceDirectories,
    directorySummaries,
  };
}

export async function applyInitialPanelDataMigration(options) {
  const plan = await inspectInitialPanelDataMigration(options);
  const stagingDirectory = path.join(
    plan.dataRoot,
    `.panel-data-init-${randomUUID()}`
  );
  const movedDirectories = [];

  await mkdir(plan.dataRoot, { recursive: true });
  await mkdir(stagingDirectory);

  try {
    for (const directoryName of REQUIRED_DIRECTORIES) {
      await cp(
        plan.sourceDirectories[directoryName],
        path.join(stagingDirectory, directoryName),
        { recursive: true, errorOnExist: true, force: false }
      );
    }

    for (const directoryName of REQUIRED_DIRECTORIES) {
      await rename(
        path.join(stagingDirectory, directoryName),
        path.join(plan.dataRoot, directoryName)
      );
      movedDirectories.push(directoryName);
    }

    return plan;
  } catch (error) {
    for (const directoryName of movedDirectories.reverse()) {
      await rename(
        path.join(plan.dataRoot, directoryName),
        path.join(stagingDirectory, directoryName)
      ).catch(() => {});
    }
    throw error;
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}
