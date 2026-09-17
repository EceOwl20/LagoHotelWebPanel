import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
export const AZURA_CONTACT_TRANSLATION_FIELDS = Object.freeze({
  contactForMore: 200,
  address: 500,
  phoneLabel: 120,
  callCenterLabel: 120,
  emailLabel: 120,
  reservationButtonText: 120,
});
const URL_FIELDS = ["instagramUrl", "facebookUrl", "youtubeUrl", "reservationUrl"];
const DETAIL_KEYS = ["username", "phone", "callCenter", "email", ...URL_FIELDS, "translations"];
const TIMEOUT_MS = 8000;

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function validText(value, limit) {
  return typeof value === "string" && Boolean(value.trim()) && value.length <= limit &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

function validPhone(value) {
  if (typeof value !== "string" || value.length > 32 || !/^\+[1-9][0-9 ()-]{5,31}$/.test(value)) return false;
  return /^\+[1-9][0-9]{6,14}$/.test(value.replace(/[ ()-]/g, ""));
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 254 &&
    /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value) &&
    !value.includes("..");
}

function validHttpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048 || /\s|[\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isValidAzuraSharedContactDetails(details) {
  return exactKeys(details, DETAIL_KEYS) &&
    validText(details.username, 100) &&
    validPhone(details.phone) && validPhone(details.callCenter) && validEmail(details.email) &&
    URL_FIELDS.every((field) => validHttpsUrl(details[field])) &&
    exactKeys(details.translations, LOCALES) &&
    LOCALES.every((locale) =>
      exactKeys(details.translations[locale], Object.keys(AZURA_CONTACT_TRANSLATION_FIELDS)) &&
      Object.entries(AZURA_CONTACT_TRANSLATION_FIELDS).every(([field, limit]) =>
        validText(details.translations[locale][field], limit))
    );
}

export function getAzuraSharedContactConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const contactUrl = new URL(url);
  contactUrl.pathname = "/api/azura/shared/contact/details";
  return { url: contactUrl.toString(), token };
}

export async function requestAzuraSharedContactDetails(method, details, {
  env = process.env,
  fetchImpl = fetch,
  revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura iletişim isteği geçersiz.", 400);
  }
  if (method === "PUT" &&
      (!isValidAzuraRevision(revision) || !isValidAzuraSharedContactDetails(details))) {
    throw new AzuraConnectionError("Azura iletişim içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraSharedContactConnection(env);
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
      ...(method === "PUT" ? { body: JSON.stringify({ details }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new AzuraConnectionError("Azura iletişim API’si geçerli bir yanıt vermedi.");
    }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura iletişim API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!isValidAzuraSharedContactDetails(payload?.details) ||
        !isValidAzuraRevision(payload?.revision)) {
      throw new AzuraConnectionError("Azura iletişim API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return { details: payload.details, revision: payload.revision };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") {
      throw new AzuraConnectionError("Azura iletişim API’si yanıt süresini aştı.", 504);
    }
    throw new AzuraConnectionError("Azura iletişim API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
