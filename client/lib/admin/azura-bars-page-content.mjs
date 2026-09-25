import { AZURA_BAR_IDS } from "./azura-bars-model.mjs";
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
    typeof v.image === "string" && /^\/uploads\/pages\/bars\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(?:jpg|jpeg|png|webp)$/i.test(v.image) &&
    !v.image.includes("..") && Number.isInteger(v.width) && v.width > 0 && Number.isInteger(v.height) && v.height > 0 &&
    v.width * v.height <= 16_000_000 && (!alt || (keys(v.translations, LOCALES) &&
      LOCALES.every((locale) => keys(v.translations[locale], ["alt"]) && text(v.translations[locale].alt, 300))));
}
export function isValidAzuraBarsPage(bundle, media) {
  const sections = ["hero", "culinaryInfo", "featureBackgrounds", "bars", "discover"];
  if (!keys(bundle, LOCALES) || !keys(media, sections)) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return keys(t, sections) && fields(t.hero, GROUP) && fields(t.culinaryInfo, GROUP) &&
      keys(t.featureBackgrounds, ["bars"]) && fields(t.featureBackgrounds.bars, GROUP) &&
      fields(t.discover, GROUP) && keys(t.bars, [...GROUP, "cards"]) &&
      GROUP.every((k) => text(t.bars[k])) && keys(t.bars.cards, AZURA_BAR_IDS) &&
      AZURA_BAR_IDS.every((id) => fields(t.bars.cards[id], GROUP));
  })) return false;
  return image(media.hero, false) && image(media.discover, false) &&
    keys(media.culinaryInfo, ["primary", "secondary"]) && image(media.culinaryInfo.primary) && image(media.culinaryInfo.secondary) &&
    keys(media.featureBackgrounds, ["bars"]) && image(media.featureBackgrounds.bars, false) &&
    keys(media.bars, AZURA_BAR_IDS) && AZURA_BAR_IDS.every((id, order) =>
      image(media.bars[id], true, true) && media.bars[id].id === id && media.bars[id].order === order);
}
