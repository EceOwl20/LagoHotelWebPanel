import { exactKeys, fields, text, LOCALES } from "./azura-spa-spor-validation.mjs";

export const CERTIFICATE_IDS = Object.freeze([
  "certificate-tr", "certificate-en", "certificate-2", "iso-9001", "iso-10002", "iso-14001",
]);
const optionalText = (value) => value === "" || text(value);
function image(record, alt = true, collection = false) {
  const pathKey = collection ? "src" : "image";
  return exactKeys(record, [pathKey, "width", "height", ...(alt ? ["translations"] : []), ...(collection ? ["id", "order"] : [])]) &&
    typeof record[pathKey] === "string" && /^\/uploads\/pages\/certificates\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i.test(record[pathKey]) &&
    !record[pathKey].includes("..") && Number.isInteger(record.width) && record.width > 0 &&
    Number.isInteger(record.height) && record.height > 0 && record.width * record.height <= 16_000_000 &&
    (!alt || (exactKeys(record.translations, LOCALES) && LOCALES.every((locale) =>
      exactKeys(record.translations[locale], ["alt"]) && text(record.translations[locale].alt, 300))));
}
export function isValidAzuraCertificatesPage(bundle, media) {
  return exactKeys(bundle, LOCALES) && LOCALES.every((locale) => {
    const value = bundle[locale];
    return exactKeys(value, ["hero", "feature", "gallery"]) &&
      exactKeys(value.hero, ["eyebrow", "title"]) && optionalText(value.hero.eyebrow) && text(value.hero.title) &&
      exactKeys(value.feature, ["eyebrow", "title", "text"]) && text(value.feature.eyebrow) && text(value.feature.title) && optionalText(value.feature.text) &&
      fields(value.gallery, ["title", "modalAlt"]);
  }) && exactKeys(media, ["hero", "feature", "gallery"]) && image(media.hero, false) && image(media.feature) &&
    exactKeys(media.gallery, ["images"]) && Array.isArray(media.gallery.images) && media.gallery.images.length === CERTIFICATE_IDS.length &&
    media.gallery.images.every((record, order) => image(record, true, true) && record.id === CERTIFICATE_IDS[order] && record.order === order);
}
