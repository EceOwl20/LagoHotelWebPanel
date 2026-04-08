import "server-only";

import path from "path";
import { GALLERY_CATEGORY_ORDER } from "./constants";
import {
  contentRoot,
  getUploadFilePath,
  readJson,
  removeFileIfExists,
  writeJson,
} from "./storage";

const galleryFilePath = path.join(contentRoot, "gallery", "gallery.json");

function createDefaultGallery() {
  return {
    categories: GALLERY_CATEGORY_ORDER.map((id) => ({
      id,
      images: [],
    })),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeGallery(gallery) {
  const byId = new Map(
    (gallery?.categories || []).map((category) => [category.id, category])
  );

  return {
    categories: GALLERY_CATEGORY_ORDER.map((id) => ({
      id,
      images: [...(byId.get(id)?.images || [])].sort(
        (left, right) => (left.order ?? 0) - (right.order ?? 0)
      ),
    })),
    updatedAt: gallery?.updatedAt || new Date().toISOString(),
  };
}

export async function readGallery() {
  const gallery = await readJson(galleryFilePath, createDefaultGallery());
  return normalizeGallery(gallery);
}

export async function writeGallery(gallery) {
  const normalized = normalizeGallery({
    ...gallery,
    updatedAt: new Date().toISOString(),
  });
  await writeJson(galleryFilePath, normalized);
  return normalized;
}

export async function deleteGalleryImage(categoryId, imageId) {
  const gallery = await readGallery();
  let fileToDelete = null;
  const categories = gallery.categories.map((category) => {
    if (category.id !== categoryId) {
      return category;
    }

    const targetImage = category.images.find((image) => image.id === imageId);

    if (targetImage?.src?.startsWith("/uploads/")) {
      fileToDelete = getUploadFilePath(targetImage.src);
    }

    return {
      ...category,
      images: category.images
        .filter((image) => image.id !== imageId)
        .map((image, index) => ({ ...image, order: index })),
    };
  });

  if (fileToDelete) {
    await removeFileIfExists(fileToDelete);
  }

  return writeGallery({ ...gallery, categories });
}
