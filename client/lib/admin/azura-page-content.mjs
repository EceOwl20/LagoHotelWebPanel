import { isValidAzuraEntertainmentPage } from "./azura-entertainment-page-content.mjs";
import { isValidAzuraBarsPage } from "./azura-bars-page-content.mjs";
import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";
import { isValidAzuraBeachPage } from "./azura-beachpools-page-content.mjs";
import { isValidAzuraKidsPage } from "./azura-kidsclub-page-content.mjs";

import { exactKeys } from "./azura-spa-spor-validation.mjs";
import { isValidAzuraSpaPage } from "./azura-spawellness-page-content.mjs";
import { isValidAzuraSporPage } from "./azura-spor-page-content.mjs";

const TIMEOUT_MS = 8000;
const validators = Object.freeze({
  spawellness: isValidAzuraSpaPage,
  spor: isValidAzuraSporPage,
  beachpools: isValidAzuraBeachPage,
  kidsclub: isValidAzuraKidsPage,
  bars: isValidAzuraBarsPage,
  entertainment: isValidAzuraEntertainmentPage,
});
export function isValidAzuraPageContent(bundle, media, pageKey = "spawellness") {
  return Object.hasOwn(validators, pageKey) && validators[pageKey](bundle, media);
}

export function getAzuraPageContentConnection(env = process.env, pageKey = "spawellness") {
  if (!["spawellness", "spor", "beachpools", "kidsclub", "bars", "entertainment"].includes(pageKey)) throw new AzuraConnectionError("Etkin olmayan sayfa.", 404);
  const { url, token } = getAzuraConnection(env);
  const pageUrl = new URL(url);
  pageUrl.pathname = `/api/azura/${pageKey}/page-content`;
  return { url: pageUrl.toString(), token };
}

export async function requestAzuraPageContent(method, bundle, media, {
  env = process.env, fetchImpl = fetch, revision, pageKey = "spawellness",
} = {}) {
  if (method !== "GET" && method !== "PUT") {
    throw new AzuraConnectionError("Azura sayfası isteği geçersiz.", 400);
  }
  if (method === "PUT" && (!isValidAzuraRevision(revision) || !isValidAzuraPageContent(bundle, media, pageKey))) {
    throw new AzuraConnectionError("Azura sayfası içeriği veya sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraPageContentConnection(env, pageKey);
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
    catch { throw new AzuraConnectionError("Azura sayfa API’si geçerli bir yanıt vermedi."); }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura sayfa API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (!exactKeys(payload, ["bundle", "media", "revision"]) ||
        !isValidAzuraPageContent(payload.bundle, payload.media, pageKey) || !isValidAzuraRevision(payload.revision)) {
      throw new AzuraConnectionError("Azura sayfa API’si beklenen içerik veya sürümü döndürmedi.");
    }
    return payload;
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") throw new AzuraConnectionError("Azura sayfa API’si yanıt süresini aştı.", 504);
    throw new AzuraConnectionError("Azura sayfa API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
