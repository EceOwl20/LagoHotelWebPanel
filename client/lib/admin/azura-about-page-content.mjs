import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
const TIMEOUT_MS = 8000;
const IMAGE_PATH = /^\/uploads\/pages\/about\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
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
export function isValidAzuraAboutPage(bundle, media) {
  if (!exactKeys(bundle, LOCALES) || !exactKeys(media, ["hero", "location", "moments", "missionVision"])) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return exactKeys(t, ["hero", "location", "missionVision"]) && fields(t.hero, ["subtitle", "title"]) &&
      fields(t.location, ["subtitle", "title", "text", "buttonText"]) &&
      exactKeys(t.missionVision, ["subtitle", "title", "text", "mission", "vision"]) &&
      ["subtitle", "title", "text"].every((key) => text(t.missionVision[key])) &&
      fields(t.missionVision.mission, ["subtitle", "title", "text"]) &&
      fields(t.missionVision.vision, ["subtitle", "title", "text"]);
  })) return false;
  return image(media.hero) && image(media.location) && exactKeys(media.missionVision, ["mission", "vision"]) &&
    image(media.missionVision.mission) && image(media.missionVision.vision) &&
    exactKeys(media.moments, ["images"]) && Array.isArray(media.moments.images) && media.moments.images.length === 4 &&
    media.moments.images.every((record, index) => image(record, true) && record.id === `about-moment-${index + 1}` && record.order === index);
}

export function getAzuraAboutPageConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const pageUrl = new URL(url);
  pageUrl.pathname = "/api/azura/about/page-content";
  return { url: pageUrl.toString(), token };
}

export async function requestAzuraAboutPage(method, bundle, media, {
  env = process.env, fetchImpl = fetch, revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura Hakkımızda sayfası isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraAboutPage(bundle, media))) {
    throw new AzuraConnectionError("Azura Hakkımızda sayfası içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraAboutPageConnection(env);
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
    catch { throw new AzuraConnectionError("Azura Hakkımızda API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura Hakkımızda API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!exactKeys(payload, ["bundle", "media", "revision"]) ||
        !isValidAzuraAboutPage(payload.bundle, payload.media) || !isValidAzuraRevision(payload.revision)) {
      throw new AzuraConnectionError("Azura Hakkımızda API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura Hakkımızda API’si yanıt süresini aştı.", 504);
    throw new AzuraConnectionError("Azura Hakkımızda API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
