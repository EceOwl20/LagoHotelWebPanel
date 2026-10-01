import {
  AzuraConnectionError,
  getAzuraConnection,
} from "./azura-experience.mjs";
import { mediaTargetScope } from "./azura-media-library-client.mjs";

const ALLOWED_QUERY_FIELDS = new Set([
  "scope",
  "q",
  "limit",
  "offset",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function fail(message, status = 400) {
  throw new AzuraConnectionError(message, status);
}

function isObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function hasExactKeys(value, keys) {
  return (
    isObject(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) =>
      Object.hasOwn(value, key)
    )
  );
}

function validImagePath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/uploads/") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
}

function validMediaLibraryImage(image) {
  return (
    hasExactKeys(image, [
      "image",
      "mimeType",
      "size",
      "width",
      "height",
      "modifiedAt",
      "name",
      "scope",
      "folder",
    ]) &&
    validImagePath(image.image) &&
    typeof image.name === "string" &&
    image.name.length > 0 &&
    typeof image.scope === "string" &&
    image.scope.length > 0 &&
    typeof image.folder === "string" &&
    IMAGE_MIME_TYPES.has(image.mimeType) &&
    Number.isSafeInteger(image.size) &&
    image.size >= 0 &&
    Number.isSafeInteger(image.width) &&
    image.width > 0 &&
    Number.isSafeInteger(image.height) &&
    image.height > 0 &&
    typeof image.modifiedAt === "string" &&
    Number.isFinite(
      Date.parse(image.modifiedAt)
    )
  );
}

function validReuseResult(payload) {
  return (
    hasExactKeys(payload, [
      "image",
      "mimeType",
      "size",
      "width",
      "height",
    ]) &&
    validImagePath(payload.image) &&
    IMAGE_MIME_TYPES.has(payload.mimeType) &&
    Number.isSafeInteger(payload.size) &&
    payload.size >= 0 &&
    Number.isSafeInteger(payload.width) &&
    payload.width > 0 &&
    Number.isSafeInteger(payload.height) &&
    payload.height > 0
  );
}

function createMediaLibraryUrl(
  connection,
  pathname
) {
  const url = new URL(connection.url);
  url.pathname = pathname;
  url.search = "";

  return url;
}

function applyMediaLibraryQuery(
  url,
  query
) {
  if (!query) {
    return;
  }

  const params =
    query instanceof URLSearchParams
      ? query
      : new URLSearchParams(query);

  for (const key of params.keys()) {
    if (!ALLOWED_QUERY_FIELDS.has(key)) {
      fail("Geçersiz medya kütüphanesi sorgusu.");
    }

    if (params.getAll(key).length !== 1) {
      fail("Geçersiz medya kütüphanesi sorgusu.");
    }
  }

  for (const [key, value] of params.entries()) {
    url.searchParams.set(key, value);
  }
}

async function readJsonResponse(
  response,
  fallbackMessage
) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    fail(
      "Azura geçerli JSON yanıtı vermedi.",
      502
    );
  }

  if (!response.ok) {
    fail(
      typeof payload?.error === "string" &&
        payload.error.length < 300
        ? payload.error
        : fallbackMessage,
      response.status
    );
  }

  return payload;
}

export async function requestAzuraMediaLibrary(
  query,
  {
    env = process.env,
    fetchImpl = fetch,
  } = {}
) {
  const connection = getAzuraConnection(env);

  const url = createMediaLibraryUrl(
    connection,
    "/api/azura/media-library"
  );

  applyMediaLibraryQuery(url, query);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    30_000
  );

  try {
    const response = await fetchImpl(
      url.toString(),
      {
        method: "GET",
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${connection.token}`,
        },
      }
    );

    const payload = await readJsonResponse(
      response,
      "Azura medya kütüphanesi alınamadı."
    );

    if (
      !hasExactKeys(payload, [
        "images",
        "total",
        "limit",
        "offset",
        "nextOffset",
      ]) ||
      !Array.isArray(payload.images) ||
      !payload.images.every(
        validMediaLibraryImage
      ) ||
      !Number.isSafeInteger(payload.total) ||
      payload.total < 0 ||
      !Number.isSafeInteger(payload.limit) ||
      payload.limit <= 0 ||
      !Number.isSafeInteger(payload.offset) ||
      payload.offset < 0 ||
      !(
        payload.nextOffset === null ||
        (
          Number.isSafeInteger(
            payload.nextOffset
          ) &&
          payload.nextOffset > payload.offset
        )
      )
    ) {
      fail(
        "Azura medya kütüphanesi yanıtı beklenen biçimde değil.",
        502
      );
    }

    return {
      ...payload,
      mediaOrigin: url.origin,
    };
  } catch (error) {
    if (error instanceof AzuraConnectionError) {
      throw error;
    }

    fail(
      error.name === "AbortError"
        ? "Azura medya kütüphanesi yanıt süresi aşıldı."
        : "Azura medya kütüphanesi bağlantısı kurulamadı.",
      error.name === "AbortError"
        ? 504
        : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function reuseAzuraMediaLibraryImage(
  body,
  {
    env = process.env,
    fetchImpl = fetch,
  } = {}
) {
  if (
    !hasExactKeys(body, [
      "image",
      "targetScope",
    ]) ||
    !validImagePath(body.image) ||
    typeof body.targetScope !== "string" ||
    mediaTargetScope(body.targetScope) !== body.targetScope
  ) {
    fail(
      "Geçersiz medya yeniden kullanım isteği."
    );
  }

  const connection = getAzuraConnection(env);

  const url = createMediaLibraryUrl(
    connection,
    "/api/azura/media-library/reuse"
  );

  const serialized = JSON.stringify(body);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    30_000
  );

  try {
    const response = await fetchImpl(
      url.toString(),
      {
        method: "POST",
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${connection.token}`,
          "Content-Type": "application/json",
        },
        body: serialized,
      }
    );

    const status = response.status;

    const payload = await readJsonResponse(
      response,
      "Azura medya görseli yeniden kullanılamadı."
    );

    if (
      ![200, 201].includes(status) ||
      !validReuseResult(payload)
    ) {
      fail(
        "Azura medya yeniden kullanım yanıtı beklenen biçimde değil.",
        502
      );
    }

    return {
      status,
      image: payload,
      mediaOrigin: url.origin,
    };
  } catch (error) {
    if (error instanceof AzuraConnectionError) {
      throw error;
    }

    fail(
      error.name === "AbortError"
        ? "Azura medya yeniden kullanım yanıt süresi aşıldı."
        : "Azura medya yeniden kullanım bağlantısı kurulamadı.",
      error.name === "AbortError"
        ? 504
        : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}
