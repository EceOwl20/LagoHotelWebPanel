import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
export const AZURA_CAROUSEL_KEYS = Object.freeze([
  "accommodation", "restaurants", "beachPools", "experiences", "kids",
]);
const IMAGE_PATH = /^\/uploads\/pages\/homepage\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
export const AZURA_HOMEPAGE_SECTION_FIELDS = Object.freeze({
  essentials: Object.freeze({
    subtitle: 200,
    title: 250,
    title1: 250,
    text1: 2000,
    title2: 250,
    text2: 2000,
    title3: 250,
    text3: 2000,
    title4: 250,
    text4: 2000,
    title5: 250,
    text5: 2000,
    title6: 250,
    text6: 2000,
    buttonText: 120,
  }),
});
const TIMEOUT_MS = 8000;

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

export function isSupportedAzuraHomepageSectionKey(sectionKey) {
  return sectionKey === "carousel" || Object.hasOwn(AZURA_HOMEPAGE_SECTION_FIELDS, sectionKey);
}

export function isValidAzuraHomepageSection(sectionKey, section) {
  if (sectionKey === "carousel") {
    return exactKeys(section, ["slides"]) &&
      Array.isArray(section.slides) && section.slides.length === AZURA_CAROUSEL_KEYS.length &&
      section.slides.every((slide, index) =>
        exactKeys(slide, ["key", "image", "translations"]) &&
        slide.key === AZURA_CAROUSEL_KEYS[index] &&
        typeof slide.image === "string" && IMAGE_PATH.test(slide.image) &&
        !slide.image.includes("..") &&
        exactKeys(slide.translations, LOCALES) &&
        LOCALES.every((locale) =>
          exactKeys(slide.translations[locale], ["title", "alt"]) &&
          [["title", 200], ["alt", 300]].every(([field, limit]) => {
            const value = slide.translations[locale][field];
            return typeof value === "string" && Boolean(value.trim()) &&
              value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
          })
        )
      );
  }
  const fields = AZURA_HOMEPAGE_SECTION_FIELDS[sectionKey];
  if (!fields || !exactKeys(section, LOCALES)) return false;
  return LOCALES.every((locale) =>
    exactKeys(section[locale], Object.keys(fields)) &&
    Object.entries(fields).every(([field, limit]) => {
      const value = section[locale][field];
      return typeof value === "string" && Boolean(value.trim()) &&
        value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
    })
  );
}

export function getAzuraHomepageSectionConnection(sectionKey, env = process.env) {
  if (!isSupportedAzuraHomepageSectionKey(sectionKey)) {
    throw new AzuraConnectionError("Azura anasayfa bölümü bulunamadı.", 404);
  }
  const { url, token } = getAzuraConnection(env);
  const sectionUrl = new URL(url);
  sectionUrl.pathname = `/api/azura/homepage/sections/${sectionKey}`;
  return { url: sectionUrl.toString(), token };
}

export async function requestAzuraHomepageSection(method, sectionKey, section, {
  env = process.env,
  fetchImpl = fetch,
  revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura bölüm isteği geçersiz.", 400);
  }
  if (method === "PUT" &&
      (!isValidAzuraRevision(revision) || !isValidAzuraHomepageSection(sectionKey, section))) {
    throw new AzuraConnectionError("Azura bölüm içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraHomepageSectionConnection(sectionKey, env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PUT" ? {
          "Content-Type": "application/json",
          "If-Match": `"${revision}"`,
        } : {}),
      },
      ...(method === "PUT" ? { body: JSON.stringify({ section }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new AzuraConnectionError("Azura bölüm API’si geçerli bir yanıt vermedi.");
    }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura bölüm API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!isValidAzuraHomepageSection(sectionKey, payload?.section) ||
        !isValidAzuraRevision(payload?.revision)) {
      throw new AzuraConnectionError("Azura bölüm API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return { section: payload.section, revision: payload.revision };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") {
      throw new AzuraConnectionError("Azura bölüm API’si yanıt süresini aştı.", 504);
    }
    throw new AzuraConnectionError("Azura bölüm API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
