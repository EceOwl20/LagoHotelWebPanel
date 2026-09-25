import { LOCALES, GROUP, exactKeys, fields, image, collection } from "./azura-spa-spor-validation.mjs";
export const SPOR_GALLERY_IDS = Object.freeze(Array.from({ length: 3 }, (_, i) => `spor-gallery-${i + 1}`));
export function isValidAzuraSporPage(bundle, media) {
  const sections = ["hero", "info", "gallery", "types"];
  if (!exactKeys(bundle, LOCALES) || !exactKeys(media, sections)) return false;
  if (!LOCALES.every((locale) => {
    const t = bundle[locale];
    return exactKeys(t, sections) && fields(t.hero, GROUP) &&
      exactKeys(t.info, ["intro", "wellness", "sauna"]) && fields(t.info.intro, GROUP) && fields(t.info.sauna, GROUP) &&
      fields(t.info.wellness, [...GROUP, "list1", "list2", "list3", "list4"]) &&
      fields(t.gallery, GROUP) && exactKeys(t.types, ["fitness", "personalTrainer"]) &&
      fields(t.types.fitness, GROUP) && fields(t.types.personalTrainer, ["title", "text"]);
  })) return false;
  return image(media.hero, false, "spor") && exactKeys(media.info, ["wellness", "sauna"]) &&
    image(media.info.wellness, false, "spor") && image(media.info.sauna, false, "spor") &&
    collection(media.gallery, SPOR_GALLERY_IDS, "spor") && exactKeys(media.types, ["fitness", "personalTrainer"]) &&
    image(media.types.fitness, false, "spor") && image(media.types.personalTrainer, false, "spor");
}
