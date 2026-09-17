import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
export const AZURA_ROOMS_CARD_KEYS = Object.freeze(["deluxe", "family", "fantasy"]);
export const AZURA_ROOMS_INTRO_FIELDS = Object.freeze({
  header: 250, buttonText1: 120, buttonText2: 120, buttonText3: 120,
  subtitle: 200, title: 250, text: 2000, checkin: 120, checkout: 120,
});
export const AZURA_ROOMS_CARD_FIELDS = Object.freeze({ title: 250, subtitle: 2000, m: 120, view: 200, buttonText: 120 });
export const AZURA_ROOMS_PARALLAX_FIELDS = Object.freeze({
  subtitle: 200, title: 250, text: 2000,
  feature1: 250, desc1: 2000, feature2: 250, desc2: 2000,
  feature3: 250, desc3: 2000, feature4: 250, desc4: 2000,
});
const IMAGE_PATH = /^\/uploads\/pages\/rooms\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
const TIMEOUT_MS = 8000;

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function validText(value, limit) {
  return typeof value === "string" && Boolean(value.trim()) && value.length <= limit &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function validFields(value, fields) {
  return exactKeys(value, Object.keys(fields)) &&
    Object.entries(fields).every(([key, limit]) => validText(value[key], limit));
}

function validImage(value) {
  return exactKeys(value, ["image", "translations"]) &&
    typeof value.image === "string" && IMAGE_PATH.test(value.image) && !value.image.includes("..") &&
    exactKeys(value.translations, LOCALES) &&
    LOCALES.every((locale) => validFields(value.translations[locale], { alt: 300 }));
}

export function isValidAzuraRoomsPage(bundle, media) {
  if (!exactKeys(bundle, LOCALES) || !exactKeys(media, ["hero", "cards", "parallax"]) ||
      !validImage(media.hero) || !validImage(media.parallax) ||
      !exactKeys(media.cards, AZURA_ROOMS_CARD_KEYS)) return false;
  if (!AZURA_ROOMS_CARD_KEYS.every((key) =>
    exactKeys(media.cards[key], ["primary", "secondary"]) &&
    validImage(media.cards[key].primary) && validImage(media.cards[key].secondary))) return false;
  return LOCALES.every((locale) => {
    const value = bundle[locale];
    if (!exactKeys(value, [...Object.keys(AZURA_ROOMS_INTRO_FIELDS),
      "RoomSection1", "RoomSection2", "RoomSection3", "RoomsParallax"])) return false;
    return Object.entries(AZURA_ROOMS_INTRO_FIELDS).every(([key, limit]) => validText(value[key], limit)) &&
      [1, 2, 3].every((index) => validFields(value[`RoomSection${index}`], AZURA_ROOMS_CARD_FIELDS)) &&
      validFields(value.RoomsParallax, AZURA_ROOMS_PARALLAX_FIELDS);
  });
}

export function getAzuraRoomsPageConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const pageUrl = new URL(url);
  pageUrl.pathname = "/api/azura/rooms/page-content";
  return { url: pageUrl.toString(), token };
}

export async function requestAzuraRoomsPage(method, bundle, media, {
  env = process.env, fetchImpl = fetch, revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura oda sayfası isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraRoomsPage(bundle, media))) {
    throw new AzuraConnectionError("Azura oda sayfası içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraRoomsPageConnection(env);
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
    catch { throw new AzuraConnectionError("Azura oda sayfası API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura oda sayfası API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!exactKeys(payload, ["bundle", "media", "revision"]) ||
        !isValidAzuraRoomsPage(payload.bundle, payload.media) || !isValidAzuraRevision(payload.revision)) {
      throw new AzuraConnectionError("Azura oda sayfası API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura oda sayfası API’si yanıt süresini aştı.", 504);
    throw new AzuraConnectionError("Azura oda sayfası API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
