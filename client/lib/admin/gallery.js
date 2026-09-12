import "server-only";

import { randomUUID } from "crypto";
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
import { enqueueFileOperation } from "./file-operation-queue.mjs";
import { isSafeUploadUrl } from "./media-references.mjs";

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

async function writeGalleryUnlocked(gallery) {
  const normalized = normalizeGallery({
    ...gallery,
    updatedAt: new Date().toISOString(),
  });
  await writeJson(galleryFilePath, normalized);
  return normalized;
}

async function reorderGalleryImagesUnlocked({ categoryId, imageIds }) {
  if (!GALLERY_CATEGORY_ORDER.includes(categoryId)) {
    throw new GalleryContentError("Sıralanacak galeri kategorisi bulunamadı.", 404);
  }

  if (
    !Array.isArray(imageIds) ||
    imageIds.some((imageId) => typeof imageId !== "string")
  ) {
    throw new GalleryContentError("Görsel sırası geçerli bir kimlik listesi olmalıdır.");
  }

  if (new Set(imageIds).size !== imageIds.length) {
    throw new GalleryContentError("Görsel sırası tekrarlanan kimlik içeremez.");
  }

  const gallery = await readGallery();
  const category = gallery.categories.find((item) => item.id === categoryId);
  const currentImageIds = category.images.map((image) => image.id);
  const currentImageIdSet = new Set(currentImageIds);
  const hasSameImages =
    imageIds.length === currentImageIds.length &&
    imageIds.every((imageId) => currentImageIdSet.has(imageId));

  if (!hasSameImages) {
    throw new GalleryContentError(
      "Galeri siz düzenlerken değişti. Güncel listeyi yenileyip tekrar deneyin.",
      409
    );
  }

  const imageById = new Map(category.images.map((image) => [image.id, image]));
  const reorderedImages = imageIds.map((imageId, order) => ({
    ...imageById.get(imageId),
    order,
  }));
  const categories = gallery.categories.map((item) =>
    item.id === categoryId ? { ...item, images: reorderedImages } : item
  );

  return writeGalleryUnlocked({ ...gallery, categories });
}

export function reorderGalleryImages(input) {
  return enqueueFileOperation(path.dirname(galleryFilePath), () =>
    reorderGalleryImagesUnlocked(input)
  );
}

async function addGalleryImageUnlocked({ categoryId, src }) {
  if (!isSafeUploadUrl(src)) {
    throw new GalleryContentError("Geçerli bir galeri görseli zorunludur.");
  }

  const resolvedCategoryId = GALLERY_CATEGORY_ORDER.includes(categoryId)
    ? categoryId
    : "other";
  const gallery = await readGallery();

  for (const category of gallery.categories) {
    const existingImage = category.images.find((image) => image.src === src);

    if (existingImage) {
      return { gallery, image: existingImage, categoryId: category.id };
    }
  }

  const image = {
    id: randomUUID(),
    src,
    order: gallery.categories.find((category) => category.id === resolvedCategoryId)
      ?.images.length || 0,
  };
  const categories = gallery.categories.map((category) =>
    category.id === resolvedCategoryId
      ? { ...category, images: [...category.images, image] }
      : category
  );
  const savedGallery = await writeGalleryUnlocked({ ...gallery, categories });

  return { gallery: savedGallery, image, categoryId: resolvedCategoryId };
}

export function addGalleryImage(input) {
  return enqueueFileOperation(path.dirname(galleryFilePath), () =>
    addGalleryImageUnlocked(input)
  );
}

async function deleteGalleryImageUnlocked(categoryId, imageId) {
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

  const updatedGallery = await writeGalleryUnlocked({ ...gallery, categories });

  if (targetImage.src?.startsWith("/uploads/")) {
    await removeFileIfExists(getUploadFilePath(targetImage.src));
  }

  return updatedGallery;
}

export function deleteGalleryImage(categoryId, imageId) {
  return enqueueFileOperation(path.dirname(galleryFilePath), () =>
    deleteGalleryImageUnlocked(categoryId, imageId)
  );
}
