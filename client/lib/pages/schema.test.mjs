import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_LOCALES,
  createStandardPageDraft,
  findLocalizedSlugConflicts,
  getLocalizedContent,
  validatePageDocument,
} from "./schema.mjs";

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
