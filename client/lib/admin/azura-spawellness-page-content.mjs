import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
const TIMEOUT_MS = 8000;
const IMAGE_PATH = /^\/uploads\/pages\/spawellness\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
}
function text(value, limit = 4000) {
  return typeof value === "string" && Boolean(value.trim()) && value.length <= limit &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
function fields(value, keys) {
  return exactKeys(value, keys) && keys.every((key) => text(value[key]));
}
function image(record, moment = false) {
  return exactKeys(record, [...(moment ? ["id", "order"] : []), "image", "width", "height", "translations"]) &&
    typeof record.image === "string" && IMAGE_PATH.test(record.image) && !record.image.includes("..") &&
    Number.isInteger(record.width) && Number.isInteger(record.height) && record.width > 0 && record.height > 0 &&
    record.width * record.height <= 16_000_000 && exactKeys(record.translations, LOCALES) &&
    LOCALES.every((locale) => exactKeys(record.translations[locale], ["alt"]) && text(record.translations[locale].alt, 300));
}
export const SPA_GALLERY_IDS = Object.freeze(Array.from({ length: 5 }, (_, i) => `spa-gallery-${i + 1}`));
export const SPA_MASSAGE_IDS = Object.freeze(["aromatic", "oriental", "classic", "facial"].map((key) => `spa-massage-${key}`));
const GROUP = ["subtitle", "title", "text"];
const SECTIONS = ["hero", "info", "gallery", "massage", "types"];
function collection(value, ids) {
  return exactKeys(value, ["images"]) && Array.isArray(value.images) && value.images.length === ids.length &&
    value.images.every((record, index) => image(record, true) && record.id === ids[index] && record.order === index);
}
export function isValidAzuraSpaPage(bundle, media) {
  if (!exactKeys(bundle, LOCALES) || !exactKeys(media, SECTIONS)) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return exactKeys(t, SECTIONS) && fields(t.hero, GROUP) &&
      exactKeys(t.info, ["intro", "wellness", "sauna"]) && fields(t.info.intro, GROUP) && fields(t.info.sauna, GROUP) &&
      fields(t.info.wellness, [...GROUP, ...Array.from({ length: 7 }, (_, i) => `list${i + 1}`)]) &&
      fields(t.gallery, GROUP) && exactKeys(t.massage, [...GROUP, "time", "cards"]) &&
      [...GROUP, "time"].every((key) => text(t.massage[key])) && exactKeys(t.massage.cards, SPA_MASSAGE_IDS) &&
      SPA_MASSAGE_IDS.every((id) => fields(t.massage.cards[id], ["title"])) &&
      exactKeys(t.types, ["indoor", "turkishBath"]) && fields(t.types.indoor, GROUP) && fields(t.types.turkishBath, GROUP);
  })) return false;
  return image(media.hero) && exactKeys(media.info, ["wellness", "sauna"]) && image(media.info.wellness) && image(media.info.sauna) &&
    collection(media.gallery, SPA_GALLERY_IDS) && collection(media.massage, SPA_MASSAGE_IDS) &&
    exactKeys(media.types, ["indoor", "turkishBath"]) && image(media.types.indoor) && image(media.types.turkishBath);
}

export function getAzuraSpaPageConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const pageUrl = new URL(url);
  pageUrl.pathname = "/api/azura/spawellness/page-content";
  return { url: pageUrl.toString(), token };
}

export async function requestAzuraSpaPage(method, bundle, media, {
  env = process.env, fetchImpl = fetch, revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura Spa & Wellness sayfası isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraSpaPage(bundle, media))) {
    throw new AzuraConnectionError("Azura Spa & Wellness sayfası içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraSpaPageConnection(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PUT" ? { "Content-Type": "application/json", "If-Match": `"${revision}"` } : {}),
      },
      ...(method === "PUT" ? { body: JSON.stringify({ bundle, media }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new AzuraConnectionError("Azura Spa & Wellness API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura Spa & Wellness API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!exactKeys(payload, ["bundle", "media", "revision"]) ||
        !isValidAzuraSpaPage(payload.bundle, payload.media) || !isValidAzuraRevision(payload.revision)) {
      throw new AzuraConnectionError("Azura Spa & Wellness API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura Spa & Wellness API’si yanıt süresini aştı.", 504);
    throw new AzuraConnectionError("Azura Spa & Wellness API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
