export const AZURA_GALLERY_CATEGORIES = Object.freeze(["general", "rooms", "flavours", "bar", "pool", "entertainment", "kidsclub", "spa", "meeting"]);
export const GALLERY_LOCALES = Object.freeze(["tr", "en", "de", "ru"]);
const ID = /^[a-z0-9][a-z0-9-]{0,127}$/;
export function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
}
export function isGallerySource(src) {
  return typeof src === "string" && /^\/uploads\/gallery\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(jpg|jpeg|png|webp)$/i.test(src) && !src.includes("..");
}
export function isGalleryTranslations(value) {
  return exactKeys(value, GALLERY_LOCALES) && GALLERY_LOCALES.every((locale) => {
    const t = value[locale];
    return exactKeys(t, ["alt"]) && typeof t.alt === "string" && Boolean(t.alt.trim()) &&
      t.alt.length <= 300 && !/[\u0000-\u001f\u007f]/.test(t.alt);
  });
}
export function isAzuraGallery(gallery) {
  if (!gallery || gallery.schemaVersion !== 1 || !Array.isArray(gallery.categories) ||
      gallery.categories.length !== AZURA_GALLERY_CATEGORIES.length) return false;
  const ids = new Set();
  return gallery.categories.every((category, index) => exactKeys(category, ["id", "images"]) &&
    category.id === AZURA_GALLERY_CATEGORIES[index] && Array.isArray(category.images) &&
    category.images.every((record, order) => {
      if (!exactKeys(record, ["id", "src", "order", "width", "height", "translations"]) ||
          typeof record.id !== "string" || !ID.test(record.id) || ids.has(record.id) ||
          record.order !== order || !isGallerySource(record.src) ||
          !Number.isInteger(record.width) || record.width < 1 || !Number.isInteger(record.height) || record.height < 1 ||
          record.width * record.height > 16_000_000 || !isGalleryTranslations(record.translations)) return false;
      ids.add(record.id);
      return true;
    }));
}
export function isGalleryOperation(body) {
  const shapes = {
    add: ["action", "categoryId", "src", "translations"],
    reorder: ["action", "categoryId", "imageIds"],
    update: ["action", "categoryId", "imageId", "translations"],
    remove: ["action", "categoryId", "imageId"],
  };
  if (!body || !Object.hasOwn(shapes, body.action) || !exactKeys(body, shapes[body.action]) ||
      !AZURA_GALLERY_CATEGORIES.includes(body.categoryId)) return false;
  if (body.action === "add") return isGallerySource(body.src) && isGalleryTranslations(body.translations);
  if (body.action === "reorder") return Array.isArray(body.imageIds) &&
    body.imageIds.every((id) => typeof id === "string" && ID.test(id)) && new Set(body.imageIds).size === body.imageIds.length;
  return typeof body.imageId === "string" && ID.test(body.imageId) &&
    (body.action === "remove" || isGalleryTranslations(body.translations));
}
