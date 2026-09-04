import "server-only";

import path from "path";
import { contentRoot, readJson, writeJson } from "./storage";
import {
  getRestaurantDetailConfigByPageKey,
  RESTAURANT_DETAIL_CONFIGS,
} from "./restaurant-detail-config.mjs";
import {
  BAR_CAFE_DETAIL_CONFIGS,
  getBarCafeDetailConfigByPageKey,
} from "./bar-cafe-detail-config.mjs";

const SITE_PAGE_KEYS = new Set([
  "certificates",
  "spawellness",
  "rooms",
  "superiorroom",
  "familyroom",
  "swimuproom",
  "familyswimup",
  "duplexfamilyroom",
  "disableroom",
  "tinyvilla",
  "restaurants",
  "barcafes",
  "beachpools",
  "kidsclub",
  "entertainment",
  "special",
  "fitness",
  ...RESTAURANT_DETAIL_CONFIGS.map((config) => config.pageKey),
  ...BAR_CAFE_DETAIL_CONFIGS.map((config) => config.pageKey),
]);
const SITE_PAGE_LOCALES = ["tr", "en", "de", "ru"];
const MAX_GALLERY_IMAGES = 100;
const ROOM_CARD_KEYS = [
  "superior",
  "family",
  "swimup",
  "familySwimup",
  "duplexFamily",
  "disabled",
];
const ROOM_OPTION_KEYS = ["family", "swimup", "superior"];

export class SitePageContentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "SitePageContentError";
    this.status = status;
  }
}

function getSitePageFilePath(pageKey) {
  if (!SITE_PAGE_KEYS.has(pageKey)) {
    throw new SitePageContentError("Desteklenmeyen sayfa içeriği.", 404);
  }

  return path.join(contentRoot, "site-pages", `${pageKey}.json`);
}

function assertImagePath(value, label) {
  if (typeof value !== "string" || !value.startsWith("/uploads/")) {
    throw new SitePageContentError(`${label} için geçerli bir görsel seçilmelidir.`);
  }
}

function normalizeImageTranslations(input) {
  return SITE_PAGE_LOCALES.reduce((translations, locale) => {
    translations[locale] = {
      alt: typeof input?.[locale]?.alt === "string" ? input[locale].alt.slice(0, 300) : "",
    };
    return translations;
  }, {});
}

function normalizeLocalizedImage(input, label) {
  assertImagePath(input?.image, label);

  return {
    image: input.image,
    translations: normalizeImageTranslations(input.translations),
  };
}

function normalizeImageCollection(input, label) {
  if (!Array.isArray(input?.images)) {
    throw new SitePageContentError(`${label} bir görsel listesi olmalıdır.`);
  }

  if (input.images.length > MAX_GALLERY_IMAGES) {
    throw new SitePageContentError(`${label} en fazla ${MAX_GALLERY_IMAGES} görsel içerebilir.`);
  }

  const imageIds = new Set();
  const images = input.images.map((image, index) => {
    if (!image?.id || typeof image.id !== "string" || imageIds.has(image.id)) {
      throw new SitePageContentError(`${label} görsellerinin benzersiz kimlikleri olmalıdır.`);
    }

    assertImagePath(image.src, `${label} görseli ${index + 1}`);
    imageIds.add(image.id);

    return {
      id: image.id,
      src: image.src,
      order: index,
      translations: normalizeImageTranslations(image.translations),
    };
  });

  return { images };
}

function normalizeCertificatesContent(input) {
  assertImagePath(input?.hero?.image, "Hero");
  assertImagePath(input?.feature?.image, "Öne çıkan sertifika");

  if (!Array.isArray(input?.gallery?.images)) {
    throw new SitePageContentError("Sertifika galerisi bir görsel listesi olmalıdır.");
  }

  if (input.gallery.images.length > MAX_GALLERY_IMAGES) {
    throw new SitePageContentError(`Galeri en fazla ${MAX_GALLERY_IMAGES} görsel içerebilir.`);
  }

  const imageIds = new Set();
  const images = input.gallery.images.map((image, index) => {
    if (!image?.id || typeof image.id !== "string" || imageIds.has(image.id)) {
      throw new SitePageContentError("Galeri görsellerinin benzersiz kimlikleri olmalıdır.");
    }

    assertImagePath(image.src, `Galeri görseli ${index + 1}`);
    imageIds.add(image.id);

    return {
      id: image.id,
      src: image.src,
      order: index,
    };
  });

  return {
    schemaVersion: 1,
    pageKey: "certificates",
    hero: { image: input.hero.image },
    feature: { image: input.feature.image },
    gallery: { images },
    updatedAt: input.updatedAt || null,
  };
}

function normalizeSpaWellnessContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "spawellness",
    hero: normalizeLocalizedImage(input?.hero, "Hero"),
    info: {
      wellness: normalizeLocalizedImage(input?.info?.wellness, "Spa bilgi görseli"),
      sauna: normalizeLocalizedImage(input?.info?.sauna, "Sauna bilgi görseli"),
    },
    gallery: normalizeImageCollection(input?.gallery, "Spa galerisi"),
    massage: normalizeImageCollection(input?.massage, "Masaj carousel alanı"),
    types: {
      indoor: normalizeLocalizedImage(input?.types?.indoor, "Kapalı spa görseli"),
      turkishBath: normalizeLocalizedImage(
        input?.types?.turkishBath,
        "Türk hamamı görseli"
      ),
    },
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeRoomsContent(input) {
  const cards = ROOM_CARD_KEYS.reduce((result, cardKey) => {
    result[cardKey] = {
      primary: normalizeLocalizedImage(
        input?.cards?.[cardKey]?.primary,
        `${cardKey} oda birinci görseli`
      ),
      secondary: normalizeLocalizedImage(
        input?.cards?.[cardKey]?.secondary,
        `${cardKey} oda ikinci görseli`
      ),
    };
    return result;
  }, {});
  const otherOptions = ROOM_OPTION_KEYS.reduce((result, optionKey) => {
    result[optionKey] = normalizeLocalizedImage(
      input?.otherOptions?.[optionKey],
      `${optionKey} diğer oda seçeneği görseli`
    );
    return result;
  }, {});

  return {
    schemaVersion: 1,
    pageKey: "rooms",
    hero: normalizeLocalizedImage(input?.hero, "Odalar hero görseli"),
    cards,
    parallax: normalizeLocalizedImage(input?.parallax, "Odalar parallax görseli"),
    otherOptions,
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeRestaurantsContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "restaurants",
    hero: normalizeLocalizedImage(input?.hero, "Restoranlar hero görseli"),
    culinaryInfo: {
      primary: normalizeLocalizedImage(
        input?.culinaryInfo?.primary,
        "Mutfak tanıtımı birinci görseli"
      ),
      secondary: normalizeLocalizedImage(
        input?.culinaryInfo?.secondary,
        "Mutfak tanıtımı ikinci görseli"
      ),
    },
    mainFeature: normalizeLocalizedImage(
      input?.mainFeature,
      "Ana restoran tanıtım görseli"
    ),
    cuisines: {
      anatolia: normalizeLocalizedImage(input?.cuisines?.anatolia, "Anatolia kart görseli"),
      gusto: normalizeLocalizedImage(input?.cuisines?.gusto, "Gusto kart görseli"),
      despina: normalizeLocalizedImage(input?.cuisines?.despina, "Despina kart görseli"),
    },
    reverseInfo: {
      primary: normalizeLocalizedImage(
        input?.reverseInfo?.primary,
        "Bistro tanıtımı birinci görseli"
      ),
      secondary: normalizeLocalizedImage(
        input?.reverseInfo?.secondary,
        "Bistro tanıtımı ikinci görseli"
      ),
    },
    decoration: normalizeLocalizedImage(input?.decoration, "Bistro dekoratif görseli"),
    cuisinesSecondary: {
      wasabi: normalizeLocalizedImage(
        input?.cuisinesSecondary?.wasabi,
        "Wasabi kart görseli"
      ),
      fuego: normalizeLocalizedImage(
        input?.cuisinesSecondary?.fuego,
        "Fuego kart görseli"
      ),
      tapaz: normalizeLocalizedImage(
        input?.cuisinesSecondary?.tapaz,
        "Tapaz kart görseli"
      ),
    },
    detailOptions: {
      wasabi: normalizeLocalizedImage(
        input?.detailOptions?.wasabi,
        "Detay sayfaları Wasabi kart görseli"
      ),
    },
    discover: normalizeLocalizedImage(input?.discover, "Keşfet arka plan görseli"),
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeBarCafesContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "barcafes",
    hero: normalizeLocalizedImage(input?.hero, "Bar ve kafeler hero görseli"),
    culinaryInfo: {
      primary: normalizeLocalizedImage(
        input?.culinaryInfo?.primary,
        "Bar ve kafeler tanıtımı birinci görseli"
      ),
      secondary: normalizeLocalizedImage(
        input?.culinaryInfo?.secondary,
        "Bar ve kafeler tanıtımı ikinci görseli"
      ),
    },
    featureBackgrounds: {
      bars: normalizeLocalizedImage(
        input?.featureBackgrounds?.bars,
        "Barlar tanıtım arka planı"
      ),
      cafes: normalizeLocalizedImage(
        input?.featureBackgrounds?.cafes,
        "Kafeler tanıtım arka planı"
      ),
    },
    bars: {
      mignon: normalizeLocalizedImage(input?.bars?.mignon, "Mignon Bar kart görseli"),
      joie: normalizeLocalizedImage(input?.bars?.joie, "Joie Bar kart görseli"),
      maldiva: normalizeLocalizedImage(input?.bars?.maldiva, "Maldiva Bar kart görseli"),
      vago: normalizeLocalizedImage(input?.bars?.vago, "Vago Bar kart görseli"),
    },
    cafes: {
      piano: normalizeLocalizedImage(input?.cafes?.piano, "Piano Bar kart görseli"),
      abella: normalizeLocalizedImage(
        input?.cafes?.abella,
        "Abella Patisserie kart görseli"
      ),
      lago: normalizeLocalizedImage(input?.cafes?.lago, "Cafe de Lago kart görseli"),
      house: normalizeLocalizedImage(input?.cafes?.house, "Cafe de House kart görseli"),
    },
    carousel: normalizeImageCollection(input?.carousel, "Bar ve kafeler carousel alanı"),
    discover: normalizeLocalizedImage(input?.discover, "Keşfet arka plan görseli"),
    updatedAt: input?.updatedAt || null,
  };
}

const BEACH_POOL_KEYS = [
  "main",
  "relax",
  "maldiva",
  "infinity",
  "maldivaKids",
  "indoor",
  "aqua",
  "kidsAqua",
  "megaAqua",
];

function normalizeBeachPoolsContent(input) {
  const pools = BEACH_POOL_KEYS.reduce((result, poolKey) => {
    result[poolKey] = {
      image: normalizeLocalizedImage(
        input?.pools?.[poolKey]?.image,
        `${poolKey} havuz kart görseli`
      ),
      hover: normalizeLocalizedImage(
        input?.pools?.[poolKey]?.hover,
        `${poolKey} havuz hover görseli`
      ),
    };
    return result;
  }, {});

  return {
    schemaVersion: 1,
    pageKey: "beachpools",
    hero: {
      desktopBackground: normalizeLocalizedImage(
        input?.hero?.desktopBackground,
        "Masaüstü hero arka planı"
      ),
      titleGraphic: normalizeLocalizedImage(
        input?.hero?.titleGraphic,
        "Hero başlık grafiği"
      ),
      wave: normalizeLocalizedImage(input?.hero?.wave, "Hero dalga görseli"),
      mobileBackground: normalizeLocalizedImage(
        input?.hero?.mobileBackground,
        "Mobil hero arka planı"
      ),
    },
    info: {
      primary: normalizeLocalizedImage(input?.info?.primary, "Plaj tanıtımı birinci görseli"),
      secondary: normalizeLocalizedImage(
        input?.info?.secondary,
        "Plaj tanıtımı ikinci görseli"
      ),
    },
    cabanaBackground: normalizeLocalizedImage(
      input?.cabanaBackground,
      "Cabana tanıtım arka planı"
    ),
    activities: {
      activity1: normalizeLocalizedImage(input?.activities?.activity1, "Birinci aktivite"),
      activity2: normalizeLocalizedImage(input?.activities?.activity2, "İkinci aktivite"),
      activity3: normalizeLocalizedImage(input?.activities?.activity3, "Üçüncü aktivite"),
      activity4: normalizeLocalizedImage(input?.activities?.activity4, "Dördüncü aktivite"),
    },
    pools,
    updatedAt: input?.updatedAt || null,
  };
}

const KIDS_ACTIVITY_KEYS = [
  "activity1",
  "activity2",
  "activity3",
  "activity4",
  "activity5",
  "activity6",
  "activity7",
  "activity8",
  "activity9",
];

function normalizeKidsClubContent(input) {
  const activityItems = KIDS_ACTIVITY_KEYS.reduce((result, activityKey) => {
    result[activityKey] = normalizeLocalizedImage(
      input?.activities?.items?.[activityKey],
      `${activityKey} çocuk aktivitesi görseli`
    );
    return result;
  }, {});

  return {
    schemaVersion: 1,
    pageKey: "kidsclub",
    hero: normalizeLocalizedImage(input?.hero, "Çocuk Kulübü hero görseli"),
    info: {
      decoration: normalizeLocalizedImage(input?.info?.decoration, "Bambu dekor görseli"),
      clubs: {
        mini: normalizeLocalizedImage(input?.info?.clubs?.mini, "Mini Kulüp kart görseli"),
        junior: normalizeLocalizedImage(
          input?.info?.clubs?.junior,
          "Junior Kulüp kart görseli"
        ),
        teenage: normalizeLocalizedImage(
          input?.info?.clubs?.teenage,
          "Genç Kulüp kart görseli"
        ),
      },
    },
    activities: {
      items: activityItems,
      indicator: normalizeLocalizedImage(
        input?.activities?.indicator,
        "Aktivite carousel panda göstergesi"
      ),
    },
    restaurant: normalizeImageCollection(
      input?.restaurant,
      "Çocuk restoranı carousel alanı"
    ),
    pools: {
      maldiva: normalizeLocalizedImage(
        input?.pools?.maldiva,
        "Maldiva Çocuk Havuzu kart görseli"
      ),
      aqua: normalizeLocalizedImage(
        input?.pools?.aqua,
        "Çocuk Aqua Havuzu kart görseli"
      ),
      indoor: normalizeLocalizedImage(
        input?.pools?.indoor,
        "Kapalı Çocuk Havuzu kart görseli"
      ),
    },
    moments: normalizeImageCollection(input?.moments, "Çocuk Kulübü anlar galerisi"),
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeEntertainmentContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "entertainment",
    hero: normalizeLocalizedImage(input?.hero, "Eğlence hero görseli"),
    info: {
      daytime: normalizeLocalizedImage(input?.info?.daytime, "Gündüz aktiviteleri görseli"),
      nighttime: normalizeLocalizedImage(input?.info?.nighttime, "Gece aktiviteleri görseli"),
    },
    activities: {
      fitness: normalizeLocalizedImage(input?.activities?.fitness, "Spor ve fitness kartı"),
      kids: normalizeLocalizedImage(input?.activities?.kids, "Çocuk ve genç kulübü kartı"),
      water: normalizeLocalizedImage(input?.activities?.water, "Su sporları kartı"),
      beachVolley: normalizeLocalizedImage(
        input?.activities?.beachVolley,
        "Plaj aktiviteleri kartı"
      ),
      sunset: normalizeLocalizedImage(input?.activities?.sunset, "Gün batımı partileri kartı"),
      stage: normalizeLocalizedImage(input?.activities?.stage, "Sahne şovları kartı"),
      themed: normalizeLocalizedImage(input?.activities?.themed, "Tema partileri kartı"),
    },
    gallery: normalizeImageCollection(input?.gallery, "Eğlence galerisi"),
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeSpecialContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "special",
    hero: normalizeLocalizedImage(input?.hero, "Özel konsept hero görseli"),
    concepts: {
      honeymoon: normalizeLocalizedImage(input?.concepts?.honeymoon, "Balayı konsepti görseli"),
      proposal: normalizeLocalizedImage(input?.concepts?.proposal, "Evlilik teklifi konsepti görseli"),
      birthday: normalizeLocalizedImage(input?.concepts?.birthday, "Doğum günü konsepti görseli"),
      pavilion: normalizeLocalizedImage(input?.concepts?.pavilion, "Pavilyon konsepti görseli"),
      flowers: normalizeLocalizedImage(input?.concepts?.flowers, "Çiçek konsepti görseli"),
    },
    cards: {
      honeymoon: normalizeLocalizedImage(input?.cards?.honeymoon, "Balayı kart görseli"),
      pavilion: normalizeLocalizedImage(input?.cards?.pavilion, "Pavilyon kart görseli"),
      proposal: normalizeLocalizedImage(input?.cards?.proposal, "Evlilik teklifi kart görseli"),
      birthday: normalizeLocalizedImage(input?.cards?.birthday, "Doğum günü kart görseli"),
      flowers: normalizeLocalizedImage(input?.cards?.flowers, "Çiçek siparişi kart görseli"),
    },
    info: {
      primary: normalizeLocalizedImage(input?.info?.primary, "Özel anlar birinci görseli"),
      secondary: normalizeLocalizedImage(input?.info?.secondary, "Özel anlar ikinci görseli"),
      layerOne: normalizeLocalizedImage(input?.info?.layerOne, "Birinci dekoratif katman"),
      layerTwo: normalizeLocalizedImage(input?.info?.layerTwo, "İkinci dekoratif katman"),
    },
    gallery: normalizeImageCollection(input?.gallery, "Özel konsept galerisi"),
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeFitnessContent(input) {
  return {
    schemaVersion: 1,
    pageKey: "fitness",
    hero: normalizeLocalizedImage(input?.hero, "Fitness hero görseli"),
    info: {
      primary: normalizeLocalizedImage(
        input?.info?.primary,
        "Fitness bilgi alanı büyük görseli"
      ),
      secondary: normalizeLocalizedImage(
        input?.info?.secondary,
        "Fitness bilgi alanı yatay görseli"
      ),
    },
    gallery: normalizeImageCollection(input?.gallery, "Fitness ana galerisi"),
    activities: normalizeImageCollection(
      input?.activities,
      "Fitness aktiviteleri carousel alanı"
    ),
    features: {
      beachVolley: normalizeLocalizedImage(
        input?.features?.beachVolley,
        "Plaj voleybolu görseli"
      ),
      personalTraining: normalizeLocalizedImage(
        input?.features?.personalTraining,
        "Kişisel antrenman görseli"
      ),
    },
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeRestaurantDetailContent(input, pageKey, pageLabel) {
  return {
    schemaVersion: 1,
    pageKey,
    hero: normalizeLocalizedImage(input?.hero, `${pageLabel} hero görseli`),
    info: {
      primary: normalizeLocalizedImage(
        input?.info?.primary,
        `${pageLabel} tanıtım birinci görseli`
      ),
      secondary: normalizeLocalizedImage(
        input?.info?.secondary,
        `${pageLabel} tanıtım ikinci görseli`
      ),
    },
    gallery: normalizeImageCollection(input?.gallery, `${pageLabel} galerisi`),
    updatedAt: input?.updatedAt || null,
  };
}

function normalizeRoomDetailContent(
  input,
  pageKey,
  pageLabel,
  { hasBackground = false } = {}
) {
  return {
    schemaVersion: 1,
    pageKey,
    hero: normalizeLocalizedImage(input?.hero, `${pageLabel} hero görseli`),
    gallery: normalizeImageCollection(input?.gallery, `${pageLabel} carousel alanı`),
    ...(hasBackground
      ? {
          background: normalizeLocalizedImage(
            input?.background,
            `${pageLabel} tanıtım arka planı`
          ),
        }
      : {}),
    updatedAt: input?.updatedAt || null,
  };
}

export async function readSitePageContent(pageKey) {
  const content = await readJson(getSitePageFilePath(pageKey), null);

  if (!content) {
    throw new SitePageContentError("Sayfa medya içeriği bulunamadı.", 404);
  }

  if (pageKey === "certificates") {
    return normalizeCertificatesContent(content);
  }

  if (pageKey === "spawellness") {
    return normalizeSpaWellnessContent(content);
  }

  if (pageKey === "rooms") {
    return normalizeRoomsContent(content);
  }

  if (pageKey === "superiorroom") {
    return normalizeRoomDetailContent(content, pageKey, "Superior oda");
  }

  if (pageKey === "familyroom") {
    return normalizeRoomDetailContent(content, pageKey, "Aile odası");
  }

  if (pageKey === "swimuproom") {
    return normalizeRoomDetailContent(content, pageKey, "Swim Up oda", {
      hasBackground: true,
    });
  }

  if (pageKey === "familyswimup") {
    return normalizeRoomDetailContent(content, pageKey, "Aile Swim Up oda", {
      hasBackground: true,
    });
  }

  if (pageKey === "duplexfamilyroom") {
    return normalizeRoomDetailContent(content, pageKey, "Dubleks aile odası", {
      hasBackground: true,
    });
  }

  if (pageKey === "disableroom") {
    return normalizeRoomDetailContent(content, pageKey, "Engelli odası");
  }

  if (pageKey === "tinyvilla") {
    return normalizeRoomDetailContent(content, pageKey, "Tiny Villa", {
      hasBackground: true,
    });
  }

  if (pageKey === "restaurants") {
    return normalizeRestaurantsContent(content);
  }

  if (pageKey === "barcafes") {
    return normalizeBarCafesContent(content);
  }

  if (pageKey === "beachpools") {
    return normalizeBeachPoolsContent(content);
  }

  if (pageKey === "kidsclub") {
    return normalizeKidsClubContent(content);
  }

  if (pageKey === "entertainment") {
    return normalizeEntertainmentContent(content);
  }

  if (pageKey === "special") {
    return normalizeSpecialContent(content);
  }

  if (pageKey === "fitness") {
    return normalizeFitnessContent(content);
  }

  const restaurantDetailConfig = getRestaurantDetailConfigByPageKey(pageKey);
  if (restaurantDetailConfig) {
    return normalizeRestaurantDetailContent(
      content,
      pageKey,
      restaurantDetailConfig.fieldLabel
    );
  }

  const barCafeDetailConfig = getBarCafeDetailConfigByPageKey(pageKey);
  if (barCafeDetailConfig) {
    return normalizeRestaurantDetailContent(
      content,
      pageKey,
      barCafeDetailConfig.fieldLabel
    );
  }

  return content;
}

export async function writeSitePageContent(pageKey, input) {
  let content;
  const restaurantDetailConfig = getRestaurantDetailConfigByPageKey(pageKey);
  const barCafeDetailConfig = getBarCafeDetailConfigByPageKey(pageKey);

  if (pageKey === "certificates") {
    content = normalizeCertificatesContent(input);
  } else if (pageKey === "spawellness") {
    content = normalizeSpaWellnessContent(input);
  } else if (pageKey === "rooms") {
    content = normalizeRoomsContent(input);
  } else if (pageKey === "superiorroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Superior oda");
  } else if (pageKey === "familyroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Aile odası");
  } else if (pageKey === "swimuproom") {
    content = normalizeRoomDetailContent(input, pageKey, "Swim Up oda", {
      hasBackground: true,
    });
  } else if (pageKey === "familyswimup") {
    content = normalizeRoomDetailContent(input, pageKey, "Aile Swim Up oda", {
      hasBackground: true,
    });
  } else if (pageKey === "duplexfamilyroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Dubleks aile odası", {
      hasBackground: true,
    });
  } else if (pageKey === "disableroom") {
    content = normalizeRoomDetailContent(input, pageKey, "Engelli odası");
  } else if (pageKey === "tinyvilla") {
    content = normalizeRoomDetailContent(input, pageKey, "Tiny Villa", {
      hasBackground: true,
    });
  } else if (pageKey === "restaurants") {
    content = normalizeRestaurantsContent(input);
  } else if (pageKey === "barcafes") {
    content = normalizeBarCafesContent(input);
  } else if (pageKey === "beachpools") {
    content = normalizeBeachPoolsContent(input);
  } else if (pageKey === "kidsclub") {
    content = normalizeKidsClubContent(input);
  } else if (pageKey === "entertainment") {
    content = normalizeEntertainmentContent(input);
  } else if (pageKey === "special") {
    content = normalizeSpecialContent(input);
  } else if (pageKey === "fitness") {
    content = normalizeFitnessContent(input);
  } else if (restaurantDetailConfig) {
    content = normalizeRestaurantDetailContent(
      input,
      pageKey,
      restaurantDetailConfig.fieldLabel
    );
  } else if (barCafeDetailConfig) {
    content = normalizeRestaurantDetailContent(
      input,
      pageKey,
      barCafeDetailConfig.fieldLabel
    );
  } else {
    throw new SitePageContentError("Desteklenmeyen sayfa içeriği.", 404);
  }

  const saved = {
    ...content,
    updatedAt: new Date().toISOString(),
  };

  await writeJson(getSitePageFilePath(pageKey), saved);
  return saved;
}
