import { isValidAzuraRevision, readAzuraRevision } from "./azura-revision.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
const IMAGE_PATH = /^\/uploads\/pages\/homepage\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
const TIMEOUT_MS = 8000;

export class AzuraConnectionError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

export function isValidExperience(experience) {
  if (!exactKeys(experience, ["background", "foreground"])) return false;

  return [experience.background, experience.foreground].every((image) =>
    exactKeys(image, ["image", "translations"]) &&
    typeof image.image === "string" && IMAGE_PATH.test(image.image) &&
    !image.image.includes("..") &&
    exactKeys(image.translations, LOCALES) &&
    LOCALES.every((locale) => {
      const translation = image.translations[locale];
      return exactKeys(translation, ["alt"]) &&
        typeof translation.alt === "string" &&
        Boolean(translation.alt.trim()) && translation.alt.length <= 300;
    })
  );
}

export function getAzuraConnection(env = process.env) {
  const rawUrl = String(env.AZURA_EXPERIENCE_API_URL || "").trim();
  const token = String(env.AZURA_SERVICE_TOKEN || "").trim();

  if (!rawUrl || !token) {
    throw new AzuraConnectionError("Azura bağlantısı yapılandırılmamış.", 503);
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AzuraConnectionError("Azura API adresi geçersiz.", 503);
  }

  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) ||
      url.username || url.password || url.search || url.hash ||
      url.pathname !== "/api/azura/homepage/experience") {
    throw new AzuraConnectionError("Azura API adresi güvenli veya beklenen biçimde değil.", 503);
  }

  return { url: url.toString(), token };
}

export async function requestAzuraExperience(method, experience, {
  env = process.env,
  fetchImpl = fetch,
  revision = null,
} = {}) {
  if (revision !== null && !isValidAzuraRevision(revision)) {
    throw new AzuraConnectionError("Azura içerik sürümü geçersiz.", 400);
  }
  const { url, token } = getAzuraConnection(env);
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
      ...(method === "PUT" ? { body: JSON.stringify({ experience }) } : {}),
      cache: "no-store",
      signal: controller.signal,
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new AzuraConnectionError("Azura API geçerli bir yanıt vermedi.");
    }

    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }

    if (!isValidExperience(payload?.experience)) {
      throw new AzuraConnectionError("Azura API beklenen içerik biçimini döndürmedi.");
    }
    const nextRevision = readAzuraRevision(payload);
    if (nextRevision === undefined) {
      throw new AzuraConnectionError("Azura API geçersiz içerik sürümü döndürdü.");
    }

    return { experience: payload.experience, revision: nextRevision };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") {
      throw new AzuraConnectionError("Azura API yanıt süresi aşıldı.", 504);
    }
    throw new AzuraConnectionError("Azura API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
