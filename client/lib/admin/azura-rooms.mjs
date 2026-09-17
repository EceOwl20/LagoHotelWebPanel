import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

export const AZURA_ROOM_KEYS = Object.freeze(["deluxe", "family", "fantasy"]);
export const AZURA_ROOM_TEXT_FIELDS = Object.freeze({ title: 250, text: 2000, area: 120, view: 200, buttonText: 120 });
const LOCALES = ["tr", "en", "de", "ru"];
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

function validTranslations(value, fields) {
  return exactKeys(value, LOCALES) && LOCALES.every((locale) =>
    exactKeys(value[locale], Object.keys(fields)) &&
    Object.entries(fields).every(([field, limit]) => validText(value[locale][field], limit))
  );
}

function validImage(image) {
  return exactKeys(image, ["src", "width", "height", "translations"]) &&
    typeof image.src === "string" && IMAGE_PATH.test(image.src) && !image.src.includes("..") &&
    Number.isInteger(image.width) && image.width > 0 &&
    Number.isInteger(image.height) && image.height > 0 &&
    image.width * image.height <= 16_000_000 &&
    validTranslations(image.translations, { alt: 300 });
}

export function isValidAzuraRoomsCards(cards) {
  return Array.isArray(cards) && cards.length === AZURA_ROOM_KEYS.length &&
    cards.every((card, index) =>
      exactKeys(card, ["key", "primary", "secondary", "translations"]) &&
      card.key === AZURA_ROOM_KEYS[index] &&
      validImage(card.primary) && validImage(card.secondary) &&
      validTranslations(card.translations, AZURA_ROOM_TEXT_FIELDS)
    );
}

export function getAzuraRoomsConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const roomsUrl = new URL(url);
  roomsUrl.pathname = "/api/azura/rooms/cards";
  return { url: roomsUrl.toString(), token };
}

export async function requestAzuraRoomsCards(method, cards, { env = process.env, fetchImpl = fetch, revision } = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura oda kartı isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraRoomsCards(cards))) {
    throw new AzuraConnectionError("Azura oda kartları veya içerik sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraRoomsConnection(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PUT" ? { "Content-Type": "application/json", "If-Match": `"${revision}"` } : {}),
      },
      ...(method === "PUT" ? { body: JSON.stringify({ cards }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new AzuraConnectionError("Azura oda kartı API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura oda kartı API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!exactKeys(payload, ["cards", "revision"]) ||
        !isValidAzuraRoomsCards(payload.cards) || !isValidAzuraRevision(payload.revision)) {
      throw new AzuraConnectionError("Azura oda kartı API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura oda kartı API’si yanıt süresini aştı.", 504);
    throw new AzuraConnectionError("Azura oda kartı API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
