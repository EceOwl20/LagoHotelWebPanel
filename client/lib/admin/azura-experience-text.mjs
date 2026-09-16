import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision, readAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
const TEXT_LIMITS = {
  subtitle: 200,
  title: 250,
  text1: 2000,
  text2: 2000,
  buttonText: 120,
};
const TIMEOUT_MS = 8000;

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

export function isValidExperienceText(experienceText) {
  if (!exactKeys(experienceText, LOCALES)) return false;
  return LOCALES.every((locale) =>
    exactKeys(experienceText[locale], Object.keys(TEXT_LIMITS)) &&
    Object.entries(TEXT_LIMITS).every(([field, limit]) => {
      const value = experienceText[locale][field];
      return typeof value === "string" && Boolean(value.trim()) &&
        value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
    })
  );
}

export function getAzuraTextConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const textUrl = new URL(url);
  textUrl.pathname += "/text";
  return { url: textUrl.toString(), token };
}

export async function requestAzuraExperienceText(method, experienceText, {
  env = process.env,
  fetchImpl = fetch,
  revision = null,
} = {}) {
  if (revision !== null && !isValidAzuraRevision(revision)) {
    throw new AzuraConnectionError("Azura metin sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraTextConnection(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
        ...(method === "PUT" && revision ? { "If-Match": `"${revision}"` } : {}),
      },
      ...(method === "PUT" ? { body: JSON.stringify({ experienceText }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new AzuraConnectionError("Azura metin API’si geçerli bir yanıt vermedi.");
    }

    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura metin API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }

    if (!isValidExperienceText(payload?.experienceText)) {
      throw new AzuraConnectionError("Azura metin API’si beklenen içerik biçimini döndürmedi.");
    }
    const nextRevision = readAzuraRevision(payload);
    if (nextRevision === undefined) {
      throw new AzuraConnectionError("Azura metin API’si geçersiz içerik sürümü döndürdü.");
    }

    return { experienceText: payload.experienceText, revision: nextRevision };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") {
      throw new AzuraConnectionError("Azura metin API’si yanıt süresini aştı.", 504);
    }
    throw new AzuraConnectionError("Azura metin API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
