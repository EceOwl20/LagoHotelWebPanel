import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
export const AZURA_RESTAURANT_CAROUSELS = Object.freeze({
  alacarteCarousel: ["orchestra", "bellaAzura", "ottoman"],
  dessertsCarousel: ["patisserie", "mazurka", "lyric"],
});
const SECTIONS = ["hero", "intro", "mainRestaurant", "alacarteCarousel", "reverse", "dessertsCarousel", "discover"];
const IMAGE_PATH = /^\/uploads\/pages\/restaurants\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
const TIMEOUT_MS = 8000;

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function text(value, allowEmpty = false, limit = 4000) {
  return typeof value === "string" && (allowEmpty || Boolean(value.trim())) &&
    value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
}

function fields(value, keys, empty = []) {
  return exactKeys(value, keys) && keys.every((key) => text(value[key], empty.includes(key)));
}

function carousel(value, key) {
  return exactKeys(value, ["subtitle", "title", "text", "cards"]) &&
    ["subtitle", "title", "text"].every((field) => text(value[field])) &&
    exactKeys(value.cards, AZURA_RESTAURANT_CAROUSELS[key]) &&
    AZURA_RESTAURANT_CAROUSELS[key].every((cardKey) =>
      fields(value.cards[cardKey], ["title", "subtitle", "text"]));
}

function image(value) {
  return exactKeys(value, ["image", "width", "height", "translations"]) &&
    typeof value.image === "string" && IMAGE_PATH.test(value.image) && !value.image.includes("..") &&
    Number.isInteger(value.width) && Number.isInteger(value.height) &&
    value.width > 0 && value.height > 0 && value.width * value.height <= 16_000_000 &&
    exactKeys(value.translations, LOCALES) &&
    LOCALES.every((locale) => exactKeys(value.translations[locale], ["alt"]) &&
      text(value.translations[locale].alt, false, 300));
}

export function isValidAzuraRestaurantsPage(bundle, media) {
  if (!exactKeys(bundle, LOCALES) || !exactKeys(media, SECTIONS)) return false;
  if (!LOCALES.every((locale) => {
    const value = bundle[locale];
    return exactKeys(value, SECTIONS) &&
      fields(value.hero, ["subtitle", "title", "text"]) &&
      fields(value.intro, ["subtitle", "title", "text", "span", "list1"], ["subtitle"]) &&
      fields(value.mainRestaurant, ["subtitle", "title", "text", "span", "list1", "list2", "list3"]) &&
      carousel(value.alacarteCarousel, "alacarteCarousel") &&
      fields(value.reverse, ["span", "title", "text", "text2"], ["span"]) &&
      carousel(value.dessertsCarousel, "dessertsCarousel") &&
      fields(value.discover, ["subtitle", "title", "text"]);
  })) return false;
  if (!image(media.hero) || !image(media.mainRestaurant) || !image(media.discover) ||
      !exactKeys(media.intro, ["primary", "secondary"]) ||
      !exactKeys(media.reverse, ["primary", "secondary"]) ||
      !["primary", "secondary"].every((slot) => image(media.intro[slot]) && image(media.reverse[slot]))) return false;
  return Object.entries(AZURA_RESTAURANT_CAROUSELS).every(([key, cardKeys]) =>
    exactKeys(media[key], ["cards"]) && exactKeys(media[key].cards, cardKeys) &&
    cardKeys.every((cardKey) => image(media[key].cards[cardKey])));
}

export function getAzuraRestaurantsPageConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const pageUrl = new URL(url);
  pageUrl.pathname = "/api/azura/restaurants/page-content";
  return { url: pageUrl.toString(), token };
}

export async function requestAzuraRestaurantsPage(method, bundle, media, {
  env = process.env, fetchImpl = fetch, revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura restoran sayfası isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraRestaurantsPage(bundle, media))) {
    throw new AzuraConnectionError("Azura restoran sayfası içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraRestaurantsPageConnection(env);
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
    catch { throw new AzuraConnectionError("Azura restoran API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura restoran API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!exactKeys(payload, ["bundle", "media", "revision"]) ||
        !isValidAzuraRestaurantsPage(payload.bundle, payload.media) || !isValidAzuraRevision(payload.revision)) {
      throw new AzuraConnectionError("Azura restoran API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura restoran API’si yanıt süresini aştı.", 504);
    throw new AzuraConnectionError("Azura restoran API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
