import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_LOCALES,
  createPageCard,
  createPageGalleryImage,
  createPageSection,
  createStandardPageDraft,
  findLocalizedSlugConflicts,
  getLocalizedContent,
  validatePageDocument,
} from "./schema.mjs";

test("component fabrikası desteklenen dinamik bölüm tiplerini oluşturur", () => {
  let id = 0;
  const idFactory = (prefix) => `${prefix}-${++id}`;
  const page = createStandardPageDraft({
    slugs: {
      tr: "component-sayfasi",
      en: "component-page",
      de: "component-seite",
      ru: "страница-компонентов",
    },
    idFactory,
  });
  const intro = createPageSection("intro", { idFactory });
  const imageText = createPageSection("imageText", {
    idFactory,
    imagePosition: "right",
  });
  const gallery = createPageSection("gallery", { idFactory });
  const carousel = createPageSection("carousel", { idFactory });
  const callToAction = createPageSection("callToAction", { idFactory });
  const cardCollection = createPageSection("cardCollection", { idFactory });

  gallery.images.push(
    createPageGalleryImage("/uploads/pages/example.webp", { idFactory })
  );
  carousel.images.push(
    createPageGalleryImage("/uploads/pages/carousel.webp", { idFactory })
  );
  cardCollection.cards.push(
    createPageCard("/uploads/pages/card.webp", { idFactory })
  );
  page.sections = [
    intro,
    imageText,
    gallery,
    carousel,
    callToAction,
    cardCollection,
  ];

  assert.deepEqual(
    page.sections.map((section) => section.type),
    ["intro", "imageText", "gallery", "carousel", "callToAction", "cardCollection"]
  );
  assert.equal(imageText.imagePosition, "right");
  assert.deepEqual(Object.keys(gallery.translations), PAGE_LOCALES);
  assert.deepEqual(Object.keys(gallery.images[0].translations), PAGE_LOCALES);
  assert.deepEqual(Object.keys(carousel.images[0].translations), PAGE_LOCALES);
  assert.equal(callToAction.overlay, true);
  assert.equal(cardCollection.displayMode, "grid");
  assert.deepEqual(Object.keys(cardCollection.cards[0].translations), PAGE_LOCALES);
  assert.deepEqual(validatePageDocument(page), []);
});

test("cardCollection fabrikası sıralanabilir ve dört dilli kart oluşturur", () => {
  let id = 0;
  const idFactory = (prefix) => `${prefix}-${++id}`;
  const section = createPageSection("cardCollection", { idFactory });
  const card = createPageCard("/uploads/pages/card.webp", { idFactory });

  section.cards.push(card);

  assert.equal(section.type, "cardCollection");
  assert.equal(section.displayMode, "grid");
  assert.equal(card.order, 0);
  assert.equal(card.image, "/uploads/pages/card.webp");
  assert.deepEqual(Object.keys(card.translations), PAGE_LOCALES);
});

test("desteklenmeyen component tipini oluşturmayı reddeder", () => {
  assert.throws(
    () => createPageSection("unknown"),
    /Desteklenmeyen component tipi/
  );
});

test("galeride kaynaksız veya tekrarlanan kimlikli görselleri reddeder", () => {
  const page = createStandardPageDraft({
    slugs: {
      tr: "galeri-testi",
      en: "gallery-test",
      de: "galerie-test",
      ru: "тест-галереи",
    },
  });
  const gallery = createPageSection("gallery");
  const firstImage = createPageGalleryImage("/uploads/pages/first.webp");

  gallery.images = [
    firstImage,
    {
      ...createPageGalleryImage(""),
      id: firstImage.id,
    },
  ];
  page.sections.push(gallery);

  const errors = validatePageDocument(page);

  assert.equal(errors.some((error) => error.includes("benzersiz bir id")), true);
  assert.equal(errors.some((error) => error.includes("kaynak zorunludur")), true);
});

test("carousel görsellerinin dizi olmasını zorunlu tutar", () => {
  const page = createStandardPageDraft({
    slugs: {
      tr: "carousel-testi",
      en: "carousel-test",
      de: "carousel-testseite",
      ru: "тест-карусели",
    },
  });
  const carousel = createPageSection("carousel");

  carousel.images = null;
  page.sections.push(carousel);

  assert.equal(
    validatePageDocument(page).some((error) =>
      error.includes("carousel görselleri bir dizi olmalıdır")
    ),
    true
  );
});

test("standart taslak dört dili ve sıralanabilir başlangıç bölümlerini oluşturur", () => {
  let id = 0;
  const page = createStandardPageDraft({
    slugs: {
      tr: "ornek-sayfa",
      en: "sample-page",
      de: "beispielseite",
      ru: "primer-stranitsy",
    },
    idFactory: (prefix) => `${prefix}-${++id}`,
  });

  assert.deepEqual(Object.keys(page.hero.translations), PAGE_LOCALES);
  assert.deepEqual(
    page.sections.map((section) => section.type),
    ["intro", "imageText", "imageText"]
  );
  assert.deepEqual(
    page.sections.map((section) => section.imagePosition).filter(Boolean),
    ["left", "right"]
  );
  assert.deepEqual(validatePageDocument(page), []);
});

test("yerelleştirilmiş içerik bulunmayan dilde Türkçe değere döner", () => {
  const value = getLocalizedContent({ tr: { title: "Başlık" } }, "de");
  assert.equal(value.title, "Başlık");
});

test("geçersiz slug ve tekrarlanan component id değerlerini reddeder", () => {
  const page = createStandardPageDraft({
    slugs: {
      tr: "Geçersiz Slug",
      en: "valid-slug",
      de: "gultiger-slug",
      ru: "pravilnyi-slug",
    },
    idFactory: () => "same-id",
  });
  const errors = validatePageDocument(page);

  assert.equal(errors.some((error) => error.includes("TR slug")), true);
  assert.equal(errors.some((error) => error.includes("tekrarlanan id")), true);
});

test("slug çakışmalarını dil bazında bulur", () => {
  const existingPage = createStandardPageDraft({
    slugs: { tr: "dugun", en: "wedding", de: "hochzeit", ru: "svadba" },
  });
  existingPage.id = "existing-page";

  const candidate = createStandardPageDraft({
    slugs: { tr: "dugun", en: "events", de: "events", ru: "sobytia" },
  });
  const conflicts = findLocalizedSlugConflicts([existingPage], candidate);

  assert.deepEqual(conflicts, [
    { locale: "tr", slug: "dugun", pageId: "existing-page" },
  ]);
});

test("Rusça slug için Kiril karakterlerini kabul eder", () => {
  const page = createStandardPageDraft({
    slugs: {
      tr: "test-sayfasi",
      en: "test-page",
      de: "testseite",
      ru: "контрольная-страница",
    },
  });

  assert.deepEqual(validatePageDocument(page), []);
});

test("eksik slug taslakta kabul edilir ancak yayında reddedilir", () => {
  const page = createStandardPageDraft({
    slugs: { tr: "test-sayfasi", en: "test-page" },
  });

  assert.deepEqual(validatePageDocument(page, { allowEmptySlugs: true }), []);
  assert.equal(validatePageDocument(page).some((error) => error.includes("DE slug")), true);
  assert.equal(validatePageDocument(page).some((error) => error.includes("RU slug")), true);
});
