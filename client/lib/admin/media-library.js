import "server-only";

import { createHash } from "crypto";
import { readdir, stat } from "fs/promises";
import path from "path";
import { uploadsRoot } from "./storage";
import { createAsyncCache } from "./async-cache.mjs";

const MEDIA_LIBRARY_CACHE_TTL_MS = 30_000;

const IMAGE_MIME_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function createAssetId(url) {
  return createHash("sha256").update(url).digest("hex").slice(0, 20);
}

async function scanDirectory(directoryPath, relativeDirectory = "") {
  const entries = await readdir(directoryPath, { withFileTypes: true });

  const results = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith(".")) {
        return [];
      }

      const relativePath = relativeDirectory
        ? path.join(relativeDirectory, entry.name)
        : entry.name;
      const absolutePath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return scanDirectory(absolutePath, relativePath);
      }

      const extension = path.extname(entry.name).toLowerCase();

      if (!entry.isFile() || !IMAGE_MIME_TYPES[extension]) {
        return [];
      }

      const fileStat = await stat(absolutePath);
      const normalizedRelativePath = relativePath.split(path.sep).join("/");
      const folderPath = path.posix.dirname(normalizedRelativePath);
      const url = `/uploads/${normalizedRelativePath}`;

      return [
        {
          id: createAssetId(url),
          url,
          name: entry.name,
          folder: folderPath === "." ? "" : folderPath,
          rootFolder: normalizedRelativePath.split("/")[0] || "",
          extension: extension.slice(1),
          mimeType: IMAGE_MIME_TYPES[extension],
          size: fileStat.size,
          modifiedAt: fileStat.mtime.toISOString(),
        },
      ];
    })
  );

  return results.flat();
}

async function scanMediaLibrary() {
  const pagesUploadsRoot = path.join(uploadsRoot, "pages");
  const assets = await scanDirectory(pagesUploadsRoot, "pages");

  assets.sort((left, right) => {
    const dateDifference = Date.parse(right.modifiedAt) - Date.parse(left.modifiedAt);
    return dateDifference || left.url.localeCompare(right.url, "tr");
  });

  const folders = [...new Set(assets.map((asset) => asset.folder))].sort((left, right) =>
    left.localeCompare(right, "tr")
  );

  return Object.freeze({
    assets: Object.freeze(assets.map((asset) => Object.freeze(asset))),
    folders: Object.freeze(folders),
    total: assets.length,
    totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
  });
}

const mediaLibraryCache = createAsyncCache({
  load: scanMediaLibrary,
  ttlMs: MEDIA_LIBRARY_CACHE_TTL_MS,
});

export function readMediaLibrary() {
  return mediaLibraryCache.get();
}

export function invalidateMediaLibrary() {
  mediaLibraryCache.invalidate();
}
