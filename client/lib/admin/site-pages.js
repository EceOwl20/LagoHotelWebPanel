import "server-only";

import path from "path";
import { contentRoot, readJson, writeJson } from "./storage";

const SITE_PAGE_KEYS = new Set([
  "certificates",
  "spawellness",
  "rooms",
  "superiorroom",
  "familyroom",
  "swimuproom",
  "familyswimup",
  "duplexfamilyroom",
  "disableroom",
]);
const SITE_PAGE_LOCALES = ["tr", "en", "de", "ru"];
const MAX_GALLERY_IMAGES = 100;
const ROOM_CARD_KEYS = [
  "superior",
  "family",
  "swimup",
  "familySwimup",
  "duplexFamily",
  "disabled",
];

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

function normalizeRoomsContent(input) {
  const cards = ROOM_CARD_KEYS.reduce((result, cardKey) => {
    result[cardKey] = {
      primary: normalizeLocalizedImage(
        input?.cards?.[cardKey]?.primary,
        `${cardKey} oda birinci görseli`
      ),
      secondary: normalizeLocalizedImage(
        input?.cards?.[cardKey]?.secondary,
        `${cardKey} oda ikinci görseli`
      ),
    };
    return result;
  }, {});

  return {
    schemaVersion: 1,
    pageKey: "rooms",
    hero: normalizeLocalizedImage(input?.hero, "Odalar hero görseli"),
    cards,
    parallax: normalizeLocalizedImage(input?.parallax, "Odalar parallax görseli"),
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeRoomDetailContent(
  input,
  pageKey,
  pageLabel,
  { hasBackground = false } = {}
) {
  return {
    schemaVersion: 1,
    pageKey,
    hero: normalizeLocalizedImage(input?.hero, `${pageLabel} hero görseli`),
    gallery: normalizeImageCollection(input?.gallery, `${pageLabel} carousel alanı`),
    ...(hasBackground
      ? {
          background: normalizeLocalizedImage(
            input?.background,
            `${pageLabel} tanıtım arka planı`
          ),
        }
      : {}),
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

  if (pageKey === "rooms") {
    return normalizeRoomsContent(content);
  }

  if (pageKey === "superiorroom") {
    return normalizeRoomDetailContent(content, pageKey, "Superior oda");
  }

  if (pageKey === "familyroom") {
    return normalizeRoomDetailContent(content, pageKey, "Aile odası");
  }

  if (pageKey === "swimuproom") {
    return normalizeRoomDetailContent(content, pageKey, "Swim Up oda", {
      hasBackground: true,
    });
  }

  if (pageKey === "familyswimup") {
    return normalizeRoomDetailContent(content, pageKey, "Aile Swim Up oda", {
      hasBackground: true,
    });
  }

  if (pageKey === "duplexfamilyroom") {
    return normalizeRoomDetailContent(content, pageKey, "Dubleks aile odası", {
      hasBackground: true,
    });
  }

  if (pageKey === "disableroom") {
    return normalizeRoomDetailContent(content, pageKey, "Engelli odası");
  }

  return content;
}

export async function writeSitePageContent(pageKey, input) {
  let content;

  if (pageKey === "certificates") {
    content = normalizeCertificatesContent(input);
  } else if (pageKey === "spawellness") {
    content = normalizeSpaWellnessContent(input);
  } else if (pageKey === "rooms") {
    content = normalizeRoomsContent(input);
  } else if (pageKey === "superiorroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Superior oda");
  } else if (pageKey === "familyroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Aile odası");
  } else if (pageKey === "swimuproom") {
    content = normalizeRoomDetailContent(input, pageKey, "Swim Up oda", {
      hasBackground: true,
    });
  } else if (pageKey === "familyswimup") {
    content = normalizeRoomDetailContent(input, pageKey, "Aile Swim Up oda", {
      hasBackground: true,
    });
  } else if (pageKey === "duplexfamilyroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Dubleks aile odası", {
      hasBackground: true,
    });
  } else if (pageKey === "disableroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Engelli odası");
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
