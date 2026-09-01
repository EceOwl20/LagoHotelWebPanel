import {
  PAGE_LOCALES,
  createPageCard,
  createPageSection,
  createStandardPageDraft,
} from "./schema.mjs";

const STARTER_CONTENT = {
  tr: {
    eyebrow: "Lago Hotel",
    heroTitle: "Yeni Sayfa",
    navigationLabel: "Yeni Sayfa",
    introTitle: "İçerik başlığınızı buraya girin",
    introText: "Yeni sayfanızın giriş metnini bu alanda düzenleyebilirsiniz.",
  },
  en: {
    eyebrow: "Lago Hotel",
    heroTitle: "New Page",
    navigationLabel: "New Page",
    introTitle: "Enter your content title here",
    introText: "You can edit the introductory text of your new page in this area.",
  },
  de: {
    eyebrow: "Lago Hotel",
    heroTitle: "Neue Seite",
    navigationLabel: "Neue Seite",
    introTitle: "Geben Sie hier Ihren Inhaltstitel ein",
    introText: "Hier können Sie den Einführungstext Ihrer neuen Seite bearbeiten.",
  },
  ru: {
    eyebrow: "Lago Hotel",
    heroTitle: "Новая страница",
    navigationLabel: "Новая страница",
    introTitle: "Введите заголовок содержимого",
    introText: "Здесь можно изменить вводный текст новой страницы.",
  },
};

function createEditorialSections() {
  return [
    createPageSection("intro"),
    createPageSection("imageText", { imagePosition: "left" }),
    createPageSection("imageText", { imagePosition: "right" }),
  ];
}

function createCardSections() {
  const cardCollection = createPageSection("cardCollection");
  cardCollection.cards = [createPageCard(), createPageCard(), createPageCard()].map(
    (card, order) => ({ ...card, order })
  );

  return [createPageSection("intro"), cardCollection];
}

const presetDefinitions = [
  {
    id: "editorial",
    title: "Tanıtım sayfası",
    description: "Giriş metni ve dönüşümlü iki görsel + metin alanıyla başlar.",
    createSections: createEditorialSections,
  },
  {
    id: "blank",
    title: "Boş başlangıç",
    description: "Hero dışında component eklenmemiş temiz bir sayfa oluşturur.",
    createSections: () => [],
  },
  {
    id: "cards",
    title: "Kartlı içerik",
    description: "Giriş metni ve grid görünümünde üç boş kartla başlar.",
    createSections: createCardSections,
  },
];

export const PAGE_PRESETS = Object.freeze(
  presetDefinitions.map(({ createSections: _createSections, ...metadata }) =>
    Object.freeze(metadata)
  )
);

function getPresetDefinition(presetId) {
  const preset = presetDefinitions.find((item) => item.id === presetId);

  if (!preset) {
    throw new Error(`Bilinmeyen sayfa preseti: ${presetId}.`);
  }

  return preset;
}

function applyStarterTranslations(draft) {
  const intro = draft.sections.find((section) => section.type === "intro");

  PAGE_LOCALES.forEach((locale) => {
    const content = STARTER_CONTENT[locale];
    draft.hero.translations[locale] = {
      ...draft.hero.translations[locale],
      eyebrow: content.eyebrow,
      title: content.heroTitle,
    };
    draft.navigation.translations[locale].label = content.navigationLabel;

    if (intro) {
      intro.translations[locale] = {
        ...intro.translations[locale],
        eyebrow: content.eyebrow,
        title: content.introTitle,
        text: content.introText,
      };
    }
  });

  return draft;
}

export function applyPagePresetSections(draft, presetId) {
  return {
    ...draft,
    sections: getPresetDefinition(presetId).createSections(),
  };
}

export function createPageDraftFromPreset(presetId = "editorial") {
  const draft = createStandardPageDraft();
  draft.sections = getPresetDefinition(presetId).createSections();
  return applyStarterTranslations(draft);
}
