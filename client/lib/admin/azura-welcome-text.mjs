import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
const TEXT_LIMITS = { subtitle: 200, title: 250, text: 2000, buttonText: 120 };
const TIMEOUT_MS = 8000;

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

export function isValidWelcomeText(welcomeText) {
  return exactKeys(welcomeText, LOCALES) && LOCALES.every((locale) =>
    exactKeys(welcomeText[locale], Object.keys(TEXT_LIMITS)) &&
    Object.entries(TEXT_LIMITS).every(([field, limit]) => {
      const value = welcomeText[locale][field];
      return typeof value === "string" && Boolean(value.trim()) &&
        value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
    })
  );
}

export function getAzuraWelcomeConnection(env = process.env) {
  const { url, token } = getAzuraConnection(env);
  const welcomeUrl = new URL(url);
  welcomeUrl.pathname = "/api/azura/homepage/welcome/text";
  return { url: welcomeUrl.toString(), token };
}

export async function requestAzuraWelcomeText(method, welcomeText, {
  env = process.env,
  fetchImpl = fetch,
  revision,
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura karşılama isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidWelcomeText(welcomeText))) {
    throw new AzuraConnectionError("Azura karşılama metni veya içerik sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraWelcomeConnection(env);
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
      ...(method === "PUT" ? { body: JSON.stringify({ welcomeText }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new AzuraConnectionError("Azura karşılama API’si geçerli bir yanıt vermedi.");
    }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura karşılama API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!isValidWelcomeText(payload?.welcomeText) || !isValidAzuraRevision(payload?.revision)) {
      throw new AzuraConnectionError("Azura karşılama API’si beklenen içerik veya sürüm biçimini döndürmedi.");
    }
    return { welcomeText: payload.welcomeText, revision: payload.revision };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") {
      throw new AzuraConnectionError("Azura karşılama API’si yanıt süresini aştı.", 504);
    }
    throw new AzuraConnectionError("Azura karşılama API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
