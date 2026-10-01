const SCOPES = new Set(["homepage", "rooms", "restaurants", "about", "spawellness", "spor", "beachpools", "kidsclub", "bars", "entertainment", "certificates", "deluxeroom", "familyroom", "fantasyroom", "gallery", "blog", "dynamic-pages"]);

export function mediaTargetScope(folder) {
  const scope = String(folder || "").replace(/^pages\//, "");
  return SCOPES.has(scope) ? scope : null;
}

export async function loadAzuraLibrary({ signal, fetchImpl = fetch } = {}) {
  const images = [];
  let offset = 0, mediaOrigin = "";
  while (offset !== null) {
    const response = await fetchImpl(`/api/admin/azura/media-library?limit=100&offset=${offset}`, { cache: "no-store", signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Azura medya kütüphanesi alınamadı.");
    if (!Array.isArray(data.images) || (data.nextOffset !== null && (!Number.isInteger(data.nextOffset) || data.nextOffset <= offset))) {
      throw new Error("Azura medya sayfalama yanıtı geçersiz.");
    }
    mediaOrigin = data.mediaOrigin || mediaOrigin;
    images.push(...data.images.map(asset => ({ ...asset, previewUrl: asset.previewUrl || `${mediaOrigin}${asset.image}` })));
    offset = data.nextOffset;
  }
  return { images, mediaOrigin };
}

export async function reuseAzuraImage(image, targetScope, { fetchImpl = fetch } = {}) {
  if (!SCOPES.has(targetScope)) throw new Error("Geçersiz hedef medya kapsamı.");
  const response = await fetchImpl("/api/admin/azura/media-library/reuse", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, targetScope }),
  });
  const asset = await response.json();
  if (!response.ok) throw new Error(asset.error || "Görsel yeniden kullanılamadı.");
  const folder = ["gallery", "blog", "dynamic-pages"].includes(targetScope) ? targetScope : `pages/${targetScope}`;
  const prefix = `/uploads/${folder}/`;
  if (!asset.image?.startsWith(prefix) || !/^[\w.-]+$/.test(asset.image.slice(prefix.length)) ||
      !Number.isInteger(asset.width) || asset.width < 1 || !Number.isInteger(asset.height) || asset.height < 1) {
    throw new Error("Görselin hedef yolu veya ölçüleri geçersiz.");
  }
  return asset;
}
