import "server-only";

import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import { isSafeUploadUrl } from "./media-references.mjs";

const appRoot = process.cwd();

export const contentRoot = path.join(appRoot, "content");
export const messagesRoot = path.join(appRoot, "messages");
export const publicRoot = path.join(appRoot, "public");
export const uploadsRoot = path.join(publicRoot, "uploads");

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}

export async function readJson(filePath, fallbackValue = null) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallbackValue;
    }

    throw error;
  }
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function listJsonFiles(dirPath) {
  await ensureDir(dirPath);
  const entries = await readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .trim();
}

export async function removeFileIfExists(filePath) {
  try {
    await rm(filePath, { force: true });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export function getUploadFilePath(relativeUrl) {
  if (!isSafeUploadUrl(relativeUrl)) {
    throw new Error("Geçersiz upload dosya yolu.");
  }

  const resolvedPath = path.resolve(publicRoot, relativeUrl.slice(1));
  const resolvedUploadsRoot = path.resolve(uploadsRoot);

  if (
    resolvedPath !== resolvedUploadsRoot &&
    !resolvedPath.startsWith(`${resolvedUploadsRoot}${path.sep}`)
  ) {
    throw new Error("Upload klasörü dışındaki dosyalara erişilemez.");
  }

  return resolvedPath;
}
