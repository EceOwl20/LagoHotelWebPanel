import { BEACH_ACTIVITY_IDS, BEACH_POOL_IDS } from "./azura-beachpools-model.mjs";

const LOCALES = ["tr", "en", "de", "ru"];
const GROUP = ["subtitle", "title", "text"];
function keys(v, names) {
  return Boolean(v && typeof v === "object" && !Array.isArray(v) &&
    Object.keys(v).length === names.length && names.every((key) => Object.hasOwn(v, key)));
}
function text(v, max = 4000) {
  return typeof v === "string" && Boolean(v.trim()) && v.length <= max && !/[\u0000-\u001f\u007f]/.test(v);
}
function fields(v, names) { return keys(v, names) && names.every((key) => text(v[key])); }
function image(v, alt = true, identity = false) {
  return keys(v, ["image", "width", "height", ...(alt ? ["translations"] : []), ...(identity ? ["id", "order"] : [])]) &&
    typeof v.image === "string" && /^\/uploads\/pages\/beachpools\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i.test(v.image) &&
    !v.image.includes("..") && Number.isInteger(v.width) && v.width > 0 && Number.isInteger(v.height) && v.height > 0 &&
    v.width * v.height <= 16_000_000 && (!alt || (keys(v.translations, LOCALES) &&
      LOCALES.every((locale) => keys(v.translations[locale], ["alt"]) && text(v.translations[locale].alt, 300))));
}
export function isValidAzuraBeachPage(bundle, media) {
  if (!keys(bundle, LOCALES) || !keys(media, ["hero", "info", "activities", "pools"])) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return keys(t, ["hero", "info", "activities", "video", "pools"]) && fields(t.hero, GROUP) &&
      fields(t.info, [...GROUP, "span", "list1", "list2", "list3"]) && fields(t.video, GROUP) &&
      keys(t.activities, [...GROUP, "cards"]) && GROUP.every((k) => text(t.activities[k])) &&
      keys(t.activities.cards, BEACH_ACTIVITY_IDS) && BEACH_ACTIVITY_IDS.every((id) => fields(t.activities.cards[id], ["title", "span"])) &&
      keys(t.pools, [...GROUP, "cards"]) && GROUP.every((k) => text(t.pools[k])) &&
      keys(t.pools.cards, BEACH_POOL_IDS) && BEACH_POOL_IDS.every((id) => fields(t.pools.cards[id], [...GROUP, "outdoor", "area", "depth"]));
  })) return false;
  return keys(media.hero, ["desktopBackground"]) && image(media.hero.desktopBackground, false) &&
    keys(media.info, ["primary", "secondary"]) && image(media.info.primary) && image(media.info.secondary) &&
    keys(media.activities, BEACH_ACTIVITY_IDS) && BEACH_ACTIVITY_IDS.every((id, order) =>
      image(media.activities[id], true, true) && media.activities[id].id === id && media.activities[id].order === order) &&
    keys(media.pools, BEACH_POOL_IDS) && BEACH_POOL_IDS.every((id, order) => {
      const pool = media.pools[id];
      return keys(pool, ["id", "order", "image", "hover"]) && pool.id === id && pool.order === order &&
        image(pool.image) && image(pool.hover, false);
    });
}
