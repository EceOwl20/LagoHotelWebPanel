import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";

const IMAGE_PATH = Object.freeze({
  "room-detail-deluxe": /^\/uploads\/pages\/(?:deluxeroom|room-options)\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
  spawellness: /^\/uploads\/pages\/spawellness\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
  about: /^\/uploads\/pages\/about\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
  experience: /^\/uploads\/pages\/homepage\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
  homepage: /^\/uploads\/pages\/homepage\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
  rooms: /^\/uploads\/pages\/rooms\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
  restaurants: /^\/uploads\/pages\/restaurants\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i,
});
const MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 30000;

export function getAzuraImagesConnection(env = process.env, scope = "experience") {
  if (!["experience", "homepage", "rooms", "restaurants", "about", "spawellness", "room-detail-deluxe"].includes(scope)) {
    throw new AzuraConnectionError("Azura görsel kapsamı geçersiz.", 400);
  }
  const { url, token } = getAzuraConnection(env);
  const imagesUrl = new URL(url);
  imagesUrl.pathname = scope === "homepage" ? "/api/azura/homepage/images"
    : scope === "rooms" ? "/api/azura/rooms/images"
    : scope === "restaurants" ? "/api/azura/restaurants/images"
    : scope === "about" ? "/api/azura/about/images"
    : scope === "spawellness" ? "/api/azura/spawellness/images"
    : scope === "room-detail-deluxe" ? "/api/azura/room-details/deluxe/images"
    : "/api/azura/homepage/experience/images";
  return { url: imagesUrl.toString(), origin: imagesUrl.origin, token };
}

export function isValidAzuraImage(record, listed = false, scope = "experience") {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  const keys = listed
    ? ["image", "mimeType", "size", "width", "height", "modifiedAt"]
    : ["image", "mimeType", "size", "width", "height"];
  if (Object.keys(record).length !== keys.length || !keys.every((key) => Object.hasOwn(record, key))) {
    return false;
  }
  if (scope === "room-detail-deluxe" && !listed &&
      (typeof record.image !== "string" || !record.image.startsWith("/uploads/pages/deluxeroom/"))) return false;
  if (typeof record.image !== "string" || !IMAGE_PATH[scope]?.test(record.image) || record.image.includes("..") ||
      !MIME_TYPES.includes(record.mimeType) ||
      !Number.isInteger(record.size) || record.size < 1 || record.size > MAX_IMAGE_BYTES ||
      !Number.isInteger(record.width) || record.width < 1 ||
      !Number.isInteger(record.height) || record.height < 1 ||
      record.width * record.height > 16_000_000) return false;
  return !listed || (typeof record.modifiedAt === "string" &&
    !Number.isNaN(Date.parse(record.modifiedAt)) && record.modifiedAt.length < 40);
}

function withPreview(record, origin) {
  return { ...record, previewUrl: `${origin}${record.image}` };
}

export async function requestAzuraImages(method, file, {
  env = process.env,
  fetchImpl = fetch,
  scope = "experience",
} = {}) {
  const { url, origin, token } = getAzuraImagesConnection(env, scope);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const options = {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    };
    if (method === "POST") {
      const form = new FormData();
      form.append("file", file, file.name);
      options.body = form;
    }
    const response = await fetchImpl(url, options);
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new AzuraConnectionError("Azura görsel API’si geçerli bir yanıt vermedi.");
    }
    if (!response.ok) {
      const message = typeof payload?.error === "string" && payload.error.length < 300
        ? payload.error : "Azura görsel API isteği başarısız oldu.";
      throw new AzuraConnectionError(message, response.status);
    }
    if (method === "GET") {
      if (!Array.isArray(payload?.images) || payload.images.length > 1000 ||
          !payload.images.every((record) => isValidAzuraImage(record, true, scope))) {
        throw new AzuraConnectionError("Azura görsel listesi beklenen biçimde değil.");
      }
      return payload.images.map((record) => withPreview(record, origin));
    }
    if (!isValidAzuraImage(payload, false, scope)) {
      throw new AzuraConnectionError("Azura yüklenen görsel için beklenen yanıtı vermedi.");
    }
    return withPreview(payload, origin);
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    if (error.name === "AbortError") {
      throw new AzuraConnectionError("Azura görsel API’si yanıt süresini aştı.", 504);
    }
    throw new AzuraConnectionError("Azura görsel API bağlantısı kurulamadı.");
  } finally {
    clearTimeout(timeout);
  }
}
