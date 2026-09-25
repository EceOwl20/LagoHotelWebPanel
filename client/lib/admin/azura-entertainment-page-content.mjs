import { ENTERTAINMENT_ACTIVITY_IDS, ENTERTAINMENT_GRID_IDS } from "./azura-entertainment-model.mjs";
const LOCALES = ["tr", "en", "de", "ru"];
const GROUP = ["subtitle", "title", "text"];
function keys(v, names) {
  return Boolean(v && typeof v === "object" && !Array.isArray(v) &&
    Object.keys(v).length === names.length && names.every((k) => Object.hasOwn(v, k)));
}
function text(v, max = 4000, empty = false) {
  return typeof v === "string" && (Boolean(v.trim()) || (empty && v === "")) &&
    v.length <= max && !/[\u0000-\u001f\u007f]/.test(v);
}
function fields(v, names) { return keys(v, names) && names.every((k) => text(v[k])); }
function image(v, alt = true, identity = false) {
  return keys(v, ["image", "width", "height", ...(alt ? ["translations"] : []), ...(identity ? ["id", "order"] : [])]) &&
    typeof v.image === "string" && /^\/uploads\/pages\/entertainment\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i.test(v.image) &&
    !v.image.includes("..") && Number.isInteger(v.width) && v.width > 0 && Number.isInteger(v.height) && v.height > 0 &&
    v.width * v.height <= 16_000_000 && (!alt || (keys(v.translations, LOCALES) &&
      LOCALES.every((locale) => keys(v.translations[locale], ["alt"]) && text(v.translations[locale].alt, 300))));
}
function collection(value, ids) {
  return Array.isArray(value) && value.length === ids.length && ids.every((id, order) =>
    image(value[order], true, true) && value[order].id === id && value[order].order === order);
}
export function isValidAzuraEntertainmentPage(bundle, media) {
  if (!keys(bundle, LOCALES) || !keys(media, ["hero", "activities", "gridSection"])) return false;
  const gridFields = [...GROUP, ...Array.from({ length: 9 }, (_, i) => ["title" + (i + 1), "text" + (i + 1)]).flat(), "daytime", "nighttime"];
  return LOCALES.every((locale) => keys(bundle[locale], ["activities", "gridSection"]) &&
    fields(bundle[locale].activities, [...GROUP, "span1", "span2", "daytime", "nighttime"]) &&
    fields(bundle[locale].gridSection, gridFields)) && image(media.hero, false) &&
    collection(media.activities, ENTERTAINMENT_ACTIVITY_IDS) && collection(media.gridSection, ENTERTAINMENT_GRID_IDS);
}
