import "server-only";

import path from "path";
import { contentRoot, readJson, writeJson } from "./storage";

const SITE_PAGE_KEYS = new Set(["certificates", "spawellness"]);
const SITE_PAGE_LOCALES = ["tr", "en", "de", "ru"];
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

function normalizeImageTranslations(input) {
  return SITE_PAGE_LOCALES.reduce((translations, locale) => {
    translations[locale] = {
      alt: typeof input?.[locale]?.alt === "string" ? input[locale].alt.slice(0, 300) : "",
    };
    return translations;
  }, {});
}

function normalizeLocalizedImage(input, label) {
  assertImagePath(input?.image, label);

  return {
    image: input.image,
    translations: normalizeImageTranslations(input.translations),
  };
}

function normalizeImageCollection(input, label) {
  if (!Array.isArray(input?.images)) {
    throw new SitePageContentError(`${label} bir görsel listesi olmalıdır.`);
  }

  if (input.images.length > MAX_GALLERY_IMAGES) {
    throw new SitePageContentError(`${label} en fazla ${MAX_GALLERY_IMAGES} görsel içerebilir.`);
  }

  const imageIds = new Set();
  const images = input.images.map((image, index) => {
    if (!image?.id || typeof image.id !== "string" || imageIds.has(image.id)) {
      throw new SitePageContentError(`${label} görsellerinin benzersiz kimlikleri olmalıdır.`);
    }

    assertImagePath(image.src, `${label} görseli ${index + 1}`);
    imageIds.add(image.id);

    return {
      id: image.id,
      src: image.src,
      order: index,
      translations: normalizeImageTranslations(image.translations),
    };
  });

  return { images };
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

function normalizeSpaWellnessContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "spawellness",
    hero: normalizeLocalizedImage(input?.hero, "Hero"),
    info: {
      wellness: normalizeLocalizedImage(input?.info?.wellness, "Spa bilgi görseli"),
      sauna: normalizeLocalizedImage(input?.info?.sauna, "Sauna bilgi görseli"),
    },
    gallery: normalizeImageCollection(input?.gallery, "Spa galerisi"),
    massage: normalizeImageCollection(input?.massage, "Masaj carousel alanı"),
    types: {
      indoor: normalizeLocalizedImage(input?.types?.indoor, "Kapalı spa görseli"),
      turkishBath: normalizeLocalizedImage(
        input?.types?.turkishBath,
        "Türk hamamı görseli"
      ),
    },
    updatedAt: input?.updatedAt || null,
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

  if (pageKey === "spawellness") {
    return normalizeSpaWellnessContent(content);
  }

  return content;
}

export async function writeSitePageContent(pageKey, input) {
  let content;

  if (pageKey === "certificates") {
    content = normalizeCertificatesContent(input);
  } else if (pageKey === "spawellness") {
    content = normalizeSpaWellnessContent(input);
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
