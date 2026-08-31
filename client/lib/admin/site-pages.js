import "server-only";

import path from "path";
import { contentRoot, readJson, writeJson } from "./storage";

const SITE_PAGE_KEYS = new Set(["certificates"]);
const MAX_GALLERY_IMAGES = 100;

export class SitePageContentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "SitePageContentError";
    this.status = status;
  }
}

function getSitePageFilePath(pageKey) {
  if (!SITE_PAGE_KEYS.has(pageKey)) {
    throw new SitePageContentError("Desteklenmeyen sayfa içeriği.", 404);
  }

  return path.join(contentRoot, "site-pages", `${pageKey}.json`);
}

function assertImagePath(value, label) {
  if (typeof value !== "string" || !value.startsWith("/uploads/")) {
    throw new SitePageContentError(`${label} için geçerli bir görsel seçilmelidir.`);
  }
}

function normalizeCertificatesContent(input) {
  assertImagePath(input?.hero?.image, "Hero");
  assertImagePath(input?.feature?.image, "Öne çıkan sertifika");

  if (!Array.isArray(input?.gallery?.images)) {
    throw new SitePageContentError("Sertifika galerisi bir görsel listesi olmalıdır.");
  }

  if (input.gallery.images.length > MAX_GALLERY_IMAGES) {
    throw new SitePageContentError(`Galeri en fazla ${MAX_GALLERY_IMAGES} görsel içerebilir.`);
  }

  const imageIds = new Set();
  const images = input.gallery.images.map((image, index) => {
    if (!image?.id || typeof image.id !== "string" || imageIds.has(image.id)) {
      throw new SitePageContentError("Galeri görsellerinin benzersiz kimlikleri olmalıdır.");
    }

    assertImagePath(image.src, `Galeri görseli ${index + 1}`);
    imageIds.add(image.id);

    return {
      id: image.id,
      src: image.src,
      order: index,
    };
  });

  return {
    schemaVersion: 1,
    pageKey: "certificates",
    hero: { image: input.hero.image },
    feature: { image: input.feature.image },
    gallery: { images },
    updatedAt: input.updatedAt || null,
  };
}

export async function readSitePageContent(pageKey) {
  const content = await readJson(getSitePageFilePath(pageKey), null);

  if (!content) {
    throw new SitePageContentError("Sayfa medya içeriği bulunamadı.", 404);
  }

  if (pageKey === "certificates") {
    return normalizeCertificatesContent(content);
  }

  return content;
}

export async function writeSitePageContent(pageKey, input) {
  let content;

  if (pageKey === "certificates") {
    content = normalizeCertificatesContent(input);
  } else {
    throw new SitePageContentError("Desteklenmeyen sayfa içeriği.", 404);
  }

  const saved = {
    ...content,
    updatedAt: new Date().toISOString(),
  };

  await writeJson(getSitePageFilePath(pageKey), saved);
  return saved;
}
