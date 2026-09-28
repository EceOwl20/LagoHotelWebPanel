import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";
import { exactKeys, isAzuraGallery, isGalleryOperation } from "./azura-gallery-model.mjs";

export async function requestAzuraGallery(method, operation, {
  env = process.env, fetchImpl = fetch, revision,
} = {}) {
  if (!["GET", "PATCH"].includes(method) || (method === "PATCH" &&
      (!isGalleryOperation(operation) || !isValidAzuraRevision(revision)))) {
    throw new AzuraConnectionError("Galeri işlemi veya sürümü geçersiz.", 400);
  }
  const connection = getAzuraConnection(env);
  const url = new URL(connection.url);
  url.pathname = "/api/azura/gallery";
  const body = method === "PATCH" ? JSON.stringify(operation) : undefined;
  if (body && Buffer.byteLength(body) > 128 * 1024) throw new AzuraConnectionError("İstek gövdesi çok büyük.", 413);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetchImpl(url.toString(), {
      method, cache: "no-store", signal: controller.signal,
      headers: { Authorization: `Bearer ${connection.token}`, ...(body ? {
        "Content-Type": "application/json", "If-Match": `"${revision}"`,
      } : {}) },
      ...(body ? { body } : {}),
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new AzuraConnectionError("Azura galeri yanıtı geçersiz."); }
    if (!response.ok) throw new AzuraConnectionError(
      typeof payload?.error === "string" && payload.error.length < 300 ? payload.error : "Azura galeri işlemi başarısız.",
      response.status);
    if (!exactKeys(payload, ["gallery", "revision"]) || !isAzuraGallery(payload.gallery) ||
        !isValidAzuraRevision(payload.revision)) throw new AzuraConnectionError("Azura galeri içeriği veya sürümü geçersiz.");
    return { ...payload, mediaOrigin: url.origin };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    throw new AzuraConnectionError(error.name === "AbortError" ? "Azura galeri yanıt süresi aşıldı." : "Azura galeri bağlantısı kurulamadı.",
      error.name === "AbortError" ? 504 : 502);
  } finally { clearTimeout(timeout); }
}
