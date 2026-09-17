export const ROOM_CARD_LOCALES = Object.freeze(["tr", "en", "de", "ru"]);

// RoomSection6 is Tiny Villa; it is not rendered among Lago's six active room cards.
export const LAGO_ROOM_CARDS = Object.freeze([
  { key: "superior", section: "RoomSection1", label: "Superior oda", link: "/rooms/superiorroom" },
  { key: "family", section: "RoomSection2", label: "Aile odası", link: "/rooms/familyroom" },
  { key: "swimup", section: "RoomSection3", label: "Swim Up oda", link: "/rooms/swimuproom" },
  { key: "familySwimup", section: "RoomSection4", label: "Aile Swim Up oda", link: "/rooms/familyswimup" },
  { key: "duplexFamily", section: "RoomSection5", label: "Dubleks aile odası", link: "/rooms/duplexfamilyroom" },
  { key: "disabled", section: "RoomSection7", label: "Engelli odası", link: "/rooms/disableroom" },
]);

export const AZURA_ROOM_CARDS = Object.freeze([
  { key: "deluxe", label: "Deluxe oda", link: "/rooms/deluxeroom" },
  { key: "family", label: "Aile odası", link: "/rooms/familyroom" },
  { key: "fantasy", label: "Fantasy oda", link: "/rooms/fantasyroom" },
]);

function assertCardKeys(cards, config) {
  if (!Array.isArray(cards) || cards.length !== config.length ||
      cards.some((card, index) => card?.key !== config[index].key)) {
    throw new Error("Oda kartlarının sayısı veya sırası beklenen biçimde değil.");
  }
}

export function lagoRoomsToCards(bundle, media) {
  if (!bundle || !media?.cards) throw new Error("Lago oda içeriği eksik.");
  return LAGO_ROOM_CARDS.map(({ key, section }) => {
    const cardMedia = media.cards[key];
    if (!cardMedia?.primary?.image || !cardMedia?.secondary?.image) {
      throw new Error(`${key} oda görselleri eksik.`);
    }
    const translations = {};
    const primaryAlt = {};
    const secondaryAlt = {};
    for (const locale of ROOM_CARD_LOCALES) {
      const value = bundle[locale]?.[section];
      if (!value) throw new Error(`${locale} ${section} oda metni eksik.`);
      translations[locale] = {
        title: value.title,
        text: value.subtitle,
        area: value.m,
        view: value.view,
        buttonText: value.buttonText,
      };
      primaryAlt[locale] = { alt: cardMedia.primary.translations?.[locale]?.alt || "" };
      secondaryAlt[locale] = { alt: cardMedia.secondary.translations?.[locale]?.alt || "" };
    }
    return {
      key,
      primary: { src: cardMedia.primary.image, translations: primaryAlt },
      secondary: { src: cardMedia.secondary.image, translations: secondaryAlt },
      translations,
    };
  });
}

export function cardsToLagoRooms(cards, bundle, media) {
  assertCardKeys(cards, LAGO_ROOM_CARDS);
  if (!bundle || !media?.cards) throw new Error("Lago oda içeriği eksik.");
  const nextBundle = Object.fromEntries(ROOM_CARD_LOCALES.map((locale) => [locale, { ...bundle[locale] }]));
  const nextMedia = { ...media, cards: { ...media.cards } };
  for (const [index, { key, section }] of LAGO_ROOM_CARDS.entries()) {
    const card = cards[index];
    if (!card.primary?.src || !card.secondary?.src) throw new Error(`${key} oda görselleri eksik.`);
    const currentMedia = media.cards[key];
    if (!currentMedia) throw new Error(`${key} oda medya alanı eksik.`);
    for (const locale of ROOM_CARD_LOCALES) {
      const value = card.translations?.[locale];
      if (!value || !bundle[locale]?.[section]) throw new Error(`${locale} ${section} oda metni eksik.`);
      nextBundle[locale][section] = {
        ...bundle[locale][section],
        title: value.title,
        subtitle: value.text,
        m: value.area,
        view: value.view,
        buttonText: value.buttonText,
      };
    }
    const image = (position) => ({
      ...currentMedia[position],
      image: card[position].src,
      translations: Object.fromEntries(ROOM_CARD_LOCALES.map((locale) => [
        locale,
        { ...currentMedia[position].translations?.[locale], alt: card[position].translations?.[locale]?.alt || "" },
      ])),
    });
    nextMedia.cards[key] = { ...currentMedia, primary: image("primary"), secondary: image("secondary") };
  }
  return { bundle: nextBundle, media: nextMedia };
}

export function azuraRoomsToCards(cards) {
  assertCardKeys(cards, AZURA_ROOM_CARDS);
  return cards;
}
