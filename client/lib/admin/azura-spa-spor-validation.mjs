export const LOCALES = ["tr", "en", "de", "ru"];
const IMAGE_PATH = /^\/uploads\/pages\/(?:spawellness|spor)\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i;
export function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
}
export function text(value, limit = 4000) {
  return typeof value === "string" && Boolean(value.trim()) && value.length <= limit &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
export function fields(value, keys) {
  return exactKeys(value, keys) && keys.every((key) => text(value[key]));
}
export function image(record, moment = false, pageKey = "spawellness") {
  return exactKeys(record, [...(moment ? ["id", "order"] : []), "image", "width", "height", "translations"]) &&
    typeof record.image === "string" && IMAGE_PATH.test(record.image) && record.image.startsWith(`/uploads/pages/${pageKey}/`) && !record.image.includes("..") &&
    Number.isInteger(record.width) && Number.isInteger(record.height) && record.width > 0 && record.height > 0 &&
    record.width * record.height <= 16_000_000 && exactKeys(record.translations, LOCALES) &&
    LOCALES.every((locale) => exactKeys(record.translations[locale], ["alt"]) && text(record.translations[locale].alt, 300));
}
export function collection(value, ids, pageKey = "spawellness") {
  return exactKeys(value, ["images"]) && Array.isArray(value.images) && value.images.length === ids.length &&
    value.images.every((record, index) => image(record, true, pageKey) && record.id === ids[index] && record.order === index);
}

export const GROUP = ["subtitle", "title", "text"];
