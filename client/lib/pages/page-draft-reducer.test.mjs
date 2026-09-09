import assert from "node:assert/strict";
import test from "node:test";
import {
  PAGE_DRAFT_ACTIONS,
  pageDraftReducer,
} from "./page-draft-reducer.mjs";
import {
  createPageSection,
  createStandardPageDraft,
} from "./schema.mjs";

function createDraft() {
  return createStandardPageDraft({
    idFactory: (() => {
      let id = 0;
      return () => `section-${++id}`;
    })(),
  });
}

test("hero, slug, menü ve SEO alanlarını diğer dilleri koruyarak günceller", () => {
  let draft = createDraft();
  const englishHero = draft.hero.translations.en;

  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.UPDATE_HERO_TRANSLATION,
    locale: "tr",
    field: "title",
    value: "Yeni başlık",
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.SET_HERO_IMAGE,
    value: "/uploads/pages/hero.webp",
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.SET_SLUG,
    locale: "tr",
    value: "yeni-sayfa",
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_TRANSLATION,
    locale: "tr",
    field: "label",
    value: "Yeni sayfa",
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_FIELD,
    field: "order",
    value: 12,
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.UPDATE_SEO_TRANSLATION,
    locale: "tr",
    field: "description",
    value: "SEO açıklaması",
  });

  assert.equal(draft.hero.translations.tr.title, "Yeni başlık");
  assert.equal(draft.hero.translations.en, englishHero);
  assert.equal(draft.hero.image, "/uploads/pages/hero.webp");
  assert.equal(draft.slugs.tr, "yeni-sayfa");
  assert.equal(draft.navigation.translations.tr.label, "Yeni sayfa");
  assert.equal(draft.navigation.order, 12);
  assert.equal(draft.seo.tr.description, "SEO açıklaması");
});

test("section ekleme, güncelleme, taşıma ve silme işlemlerini kimlikle uygular", () => {
  let draft = createDraft();
  const addedSection = createPageSection("gallery", { idFactory: () => "gallery-1" });

  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.ADD_SECTION,
    section: addedSection,
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.UPDATE_SECTION_TRANSLATION,
    sectionId: addedSection.id,
    locale: "tr",
    field: "title",
    value: "Galeri",
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.UPDATE_SECTION_FIELD,
    sectionId: addedSection.id,
    field: "enabled",
    value: false,
  });
  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.MOVE_SECTION,
    index: draft.sections.length - 1,
    direction: -1,
  });

  const movedSection = draft.sections.at(-2);
  assert.equal(movedSection.id, addedSection.id);
  assert.equal(movedSection.translations.tr.title, "Galeri");
  assert.equal(movedSection.enabled, false);

  draft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.REMOVE_SECTION,
    sectionId: addedSection.id,
  });
  assert.equal(draft.sections.some((section) => section.id === addedSection.id), false);
});

test("geçersiz taşıma ve bilinmeyen action taslağı değiştirmez", () => {
  const draft = createDraft();

  assert.equal(
    pageDraftReducer(draft, {
      type: PAGE_DRAFT_ACTIONS.MOVE_SECTION,
      index: 0,
      direction: -1,
    }),
    draft
  );
  assert.equal(pageDraftReducer(draft, { type: "unknown" }), draft);
});

test("sunucudan dönen taslağı doğrudan çalışma kopyası yapar", () => {
  const draft = createDraft();
  const savedDraft = { ...draft, id: "saved-page", updatedAt: "2026-09-09T12:00:00.000Z" };

  assert.equal(
    pageDraftReducer(draft, {
      type: PAGE_DRAFT_ACTIONS.REPLACE,
      draft: savedDraft,
    }),
    savedDraft
  );
});

test("preset yalnızca section düzenini değiştirir", () => {
  const draft = createDraft();
  draft.slugs.tr = "korunan-adres";
  draft.hero.image = "/uploads/pages/korunan.webp";

  const updatedDraft = pageDraftReducer(draft, {
    type: PAGE_DRAFT_ACTIONS.APPLY_PRESET,
    presetId: "blank",
  });

  assert.equal(updatedDraft.slugs.tr, "korunan-adres");
  assert.equal(updatedDraft.hero.image, "/uploads/pages/korunan.webp");
  assert.deepEqual(updatedDraft.sections, []);
});
