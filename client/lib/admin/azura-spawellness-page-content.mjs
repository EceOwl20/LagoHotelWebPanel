import { LOCALES, GROUP, exactKeys, fields, text, image, collection } from "./azura-spa-spor-validation.mjs";
export const SPA_GALLERY_IDS = Object.freeze(Array.from({ length: 5 }, (_, i) => `spa-gallery-${i + 1}`));
export const SPA_MASSAGE_IDS = Object.freeze(["aromatic", "oriental", "classic", "facial"].map((key) => `spa-massage-${key}`));
const SECTIONS = ["hero", "info", "gallery", "massage", "types"];
export function isValidAzuraSpaPage(bundle, media) {
  if (!exactKeys(bundle, LOCALES) || !exactKeys(media, SECTIONS)) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return exactKeys(t, SECTIONS) && fields(t.hero, GROUP) &&
      exactKeys(t.info, ["intro", "wellness", "sauna"]) && fields(t.info.intro, GROUP) && fields(t.info.sauna, GROUP) &&
      fields(t.info.wellness, [...GROUP, ...Array.from({ length: 7 }, (_, i) => `list${i + 1}`)]) &&
      fields(t.gallery, GROUP) && exactKeys(t.massage, [...GROUP, "time", "cards"]) &&
      [...GROUP, "time"].every((key) => text(t.massage[key])) && exactKeys(t.massage.cards, SPA_MASSAGE_IDS) &&
      SPA_MASSAGE_IDS.every((id) => fields(t.massage.cards[id], ["title"])) &&
      exactKeys(t.types, ["indoor", "turkishBath"]) && fields(t.types.indoor, GROUP) && fields(t.types.turkishBath, GROUP);
  })) return false;
  return image(media.hero) && exactKeys(media.info, ["wellness", "sauna"]) && image(media.info.wellness) && image(media.info.sauna) &&
    collection(media.gallery, SPA_GALLERY_IDS) && collection(media.massage, SPA_MASSAGE_IDS) &&
    exactKeys(media.types, ["indoor", "turkishBath"]) && image(media.types.indoor) && image(media.types.turkishBath);
}
