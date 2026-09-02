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
import { findManagedMediaUsage } from "./media-usage";

const galleryFilePath = path.join(contentRoot, "gallery", "gallery.json");

export class GalleryContentError extends Error {
  constructor(message, status = 400, usages = []) {
    super(message);
    this.name = "GalleryContentError";
    this.status = status;
    this.usages = usages;
  }
}

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
  const category = gallery.categories.find((item) => item.id === categoryId);
  const targetImage = category?.images.find((image) => image.id === imageId);

  if (!targetImage) {
    throw new GalleryContentError("Silinecek galeri görseli bulunamadı.", 404);
  }

  const sourceId = `gallery:${categoryId}:${imageId}`;
  const usages = await findManagedMediaUsage(targetImage.src, {
    excludeSourceIds: [sourceId],
  });

  if (usages.length > 0) {
    throw new GalleryContentError(
      "Bu görsel başka içeriklerde kullanıldığı için silinemez.",
      409,
      usages
    );
  }

  const categories = gallery.categories.map((category) => {
    if (category.id !== categoryId) {
      return category;
    }

    return {
      ...category,
      images: category.images
        .filter((image) => image.id !== imageId)
        .map((image, index) => ({ ...image, order: index })),
    };
  });

  const updatedGallery = await writeGallery({ ...gallery, categories });

  if (targetImage.src?.startsWith("/uploads/")) {
    await removeFileIfExists(getUploadFilePath(targetImage.src));
  }

  return updatedGallery;
}
