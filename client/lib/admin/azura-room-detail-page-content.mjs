import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";
import { azuraRoomDetailConfig } from "./room-detail-model.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
export const ROOM_FEATURE_IDS = Object.freeze(["area", "dresser", "nonSmoking", "minibar", "safe", "hairdryer", "bathEssentials", "teaCoffee", "tvWifi", "balcony", "shower"]);
const GROUP = ["subtitle", "title", "text"];
function keys(value, expected) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key)));
}
function text(value, max = 4000) {
  return typeof value === "string" && Boolean(value.trim()) && value.length <= max && !/[<>\u0000-\u001f\u007f]/.test(value);
}
function fields(value, names) { return keys(value, names) && names.every((key) => text(value[key])); }

export function isValidRoomTourUrl(value) {
  if (typeof value !== "string" || value.length > 1500 || /[\s\\<>]/.test(value)) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  if (!value.startsWith("https://kuula.co/share/collection/") || url.origin !== "https://kuula.co" ||
      url.username || url.password || url.hash || !/^\/share\/collection\/[A-Za-z0-9]{5}$/.test(url.pathname)) return false;
  const rules = { logo: /^[01]$/, info: /^[01]$/, fs: /^[01]$/, vr: /^[01]$/, autorotate: /^\d+(\.\d+)?$/,
    autop: /^\d+$/, autopalt: /^[01]$/, thumbs: /^\d+$/, margin: /^\d+$/, alpha: /^(0(\.\d+)?|1(\.0+)?)$/,
    alph: /^$/ }; // Existing empty alph parameter is supported by Azura.
  const seen = new Set();
  for (const [key, val] of url.searchParams) {
    if (!Object.hasOwn(rules, key) || !rules[key].test(val) || seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function image(record, config, collection = false, shared = false) {
  if (!keys(record, [...(collection ? ["id", "order"] : []), "image", "width", "height", "translations"])) return false;
  const match = typeof record.image === "string" && record.image.match(/^\/uploads\/pages\/([a-z-]+)\/([A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp))$/i);
  return Boolean(match && !record.image.includes("..") && (match[1] === config.pageKey || (shared && match[1] === "room-options")) &&
    Number.isInteger(record.width) && Number.isInteger(record.height) && record.width > 0 && record.height > 0 && record.width * record.height <= 16_000_000 &&
    keys(record.translations, LOCALES) && LOCALES.every((locale) => keys(record.translations[locale], ["alt"]) && text(record.translations[locale].alt, 300)));
}
function collection(value, ids, config, shared = false) {
  return keys(value, ["images"]) && Array.isArray(value.images) && value.images.length === ids.length &&
    value.images.every((record, index) => image(record, config, true, shared) && record.id === ids[index] && record.order === index);
}

export function isValidAzuraRoomDetailPage(roomKey, bundle, media) {
  const config = azuraRoomDetailConfig(roomKey);
  if (!config || !keys(bundle, ["translations", "tours"]) || !keys(bundle.translations, LOCALES) || !keys(media, ["hero", "gallery", "background", "otherOptions"])) return false;
  const banner = ["subtitle", "title", "text1", "text2", "text3"];
  const info = ["subtitle", "title", "text", "title2", "title3", "text2"];
  if (!LOCALES.every((locale) => {
    const t = bundle.translations[locale];
    return keys(t, [...banner, "RoomInfo", "BackgroundSection", "RoomTour", "OtherOptions"]) && banner.every((key) => text(t[key])) &&
      keys(t.RoomInfo, [...info, "amenities", "features"]) && info.every((key) => text(t.RoomInfo[key])) &&
      fields(t.RoomInfo.amenities, config.amenityIds) && fields(t.RoomInfo.features, ROOM_FEATURE_IDS) &&
      fields(t.BackgroundSection, config.backgroundFields) && keys(t.RoomTour, config.tourIds) && config.tourIds.every((id) => fields(t.RoomTour[id], GROUP)) &&
      keys(t.OtherOptions, ["span", "title", "buttonText", "cards"]) && ["span", "title", "buttonText"].every((key) => text(t.OtherOptions[key])) &&
      keys(t.OtherOptions.cards, config.optionIds) && config.optionIds.every((id) => fields(t.OtherOptions.cards[id], ["subtitle", "title", "m", "capacity", "text"]));
  })) return false;
  return image(media.hero, config) && image(media.background, config) && collection(media.gallery, config.galleryIds, config) &&
    collection(media.otherOptions, config.optionIds, config, true) && Array.isArray(bundle.tours) && bundle.tours.length === config.tourIds.length &&
    bundle.tours.every((tour, index) => keys(tour, ["id", "order", "url"]) && tour.id === config.tourIds[index] && tour.order === index && isValidRoomTourUrl(tour.url));
}

export function getAzuraRoomDetailConnection(roomKey, env = process.env) {
  if (!azuraRoomDetailConfig(roomKey)) throw new AzuraConnectionError("Etkin olmayan oda kimliği.", 404);
  const { url, token } = getAzuraConnection(env);
  const pageUrl = new URL(url);
  pageUrl.pathname = `/api/azura/room-details/${roomKey}/page-content`;
  return { url: pageUrl.toString(), token };
}

export async function requestAzuraRoomDetailPage(roomKey, method, bundle, media, { env = process.env, fetchImpl = fetch, revision } = {}) {
  const { url, token } = getAzuraRoomDetailConnection(roomKey, env);
  if (!["GET", "PUT"].includes(method) || (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraRoomDetailPage(roomKey, bundle, media)))) {
    throw new AzuraConnectionError("Oda detayı içeriği veya sürümü geçersiz.", 400);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, { method, headers: { Authorization: `Bearer ${token}`,
      ...(method === "PUT" ? { "Content-Type": "application/json", "If-Match": `"${revision}"` } : {}) },
      ...(method === "PUT" ? { body: JSON.stringify({ bundle, media }) } : {}), cache: "no-store", signal: controller.signal });
    let payload;
    try { payload = await response.json(); } catch { throw new AzuraConnectionError("Azura oda API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) throw new AzuraConnectionError(typeof payload?.error === "string" && payload.error.length < 300 ? payload.error : "Azura oda isteği başarısız oldu.", response.status);
    if (!keys(payload, ["bundle", "media", "revision"]) || !isValidAzuraRevision(payload.revision) || !isValidAzuraRoomDetailPage(roomKey, payload.bundle, payload.media)) {
      throw new AzuraConnectionError("Azura oda API’si beklenen içeriği döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura oda isteği zaman aşımına uğradı.", 504);
    throw new AzuraConnectionError("Azura oda API bağlantısı kurulamadı.");
  } finally { clearTimeout(timeout); }
}
