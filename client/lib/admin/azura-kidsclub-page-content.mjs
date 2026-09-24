import { KIDS_ACTIVITY_IDS, KIDS_POOL_IDS, KIDS_MOMENT_IDS } from "./azura-kidsclub-model.mjs";
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
    typeof v.image === "string" && /^\/uploads\/pages\/kidsclub\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i.test(v.image) &&
    !v.image.includes("..") && Number.isInteger(v.width) && v.width > 0 && Number.isInteger(v.height) && v.height > 0 &&
    v.width * v.height <= 16_000_000 && (!alt || (keys(v.translations, LOCALES) &&
      LOCALES.every((locale) => keys(v.translations[locale], ["alt"]) && text(v.translations[locale].alt, 300))));
}
function cards(v, ids) {
  return keys(v, ids) && ids.every((id, order) => image(v[id], true, true) && v[id].id === id && v[id].order === order);
}
export function isValidAzuraKidsPage(bundle, media) {
  if (!keys(bundle, LOCALES) || !keys(media, ["hero", "info", "activities", "pools", "moments"])) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return keys(t, ["hero", "info", "icons", "activities", "pools", "moments"]) &&
      fields(t.hero, GROUP) && fields(t.info, GROUP) && fields(t.icons, ["environment", "activities", "social", "staff"]) &&
      keys(t.activities, [...GROUP, "items"]) && GROUP.every((k) => text(t.activities[k])) &&
      keys(t.activities.items, KIDS_ACTIVITY_IDS) && KIDS_ACTIVITY_IDS.every((id) => {
        const item = t.activities.items[id];
        return keys(item, ["title", "repeatTitle"]) && text(item.title) &&
          text(item.repeatTitle, 4000, id === "activity4" || id === "activity5");
      }) && keys(t.pools, [...GROUP, "cards"]) && GROUP.every((k) => text(t.pools[k])) &&
      keys(t.pools.cards, KIDS_POOL_IDS) && KIDS_POOL_IDS.every((id) => fields(t.pools.cards[id], GROUP)) &&
      fields(t.moments, ["title"]);
  })) return false;
  return image(media.hero, false) && keys(media.info, ["primary", "secondary"]) &&
    image(media.info.primary) && image(media.info.secondary) &&
    keys(media.activities, ["items"]) && cards(media.activities.items, KIDS_ACTIVITY_IDS) &&
    cards(media.pools, KIDS_POOL_IDS) && keys(media.moments, ["images"]) &&
    Array.isArray(media.moments.images) && media.moments.images.length === KIDS_MOMENT_IDS.length &&
    media.moments.images.every((v, order) => image(v, true, true) && v.id === KIDS_MOMENT_IDS[order] && v.order === order);
}
