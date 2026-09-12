import assert from "node:assert/strict";
import test from "node:test";
import { comparePageDrafts } from "./page-draft-comparison.mjs";
import { createStandardPageDraft } from "./schema.mjs";

function createDraft() {
  let id = 0;
  return createStandardPageDraft({ idFactory: (prefix) => `${prefix}-${++id}` });
}

test("aynı taslaklar arasında fark bildirmez", () => {
  const draft = createDraft();

  assert.deepEqual(comparePageDrafts(draft, structuredClone(draft)), {
    isIdentical: true,
    changedLocales: [],
    settingsChanged: false,
    components: {
      added: 0,
      removed: 0,
      modified: 0,
      orderChanged: false,
    },
    componentChanges: {
      added: [],
      removed: [],
      modified: [],
    },
  });
});

test("dil, ayar ve component farklarını özetler", () => {
  const previousDraft = createDraft();
  const currentDraft = structuredClone(previousDraft);
  currentDraft.hero.image = "/uploads/new-hero.webp";
  currentDraft.hero.translations.en.title = "New title";
  currentDraft.sections[0].translations.tr.text = "Yeni metin";
  currentDraft.sections = [
    currentDraft.sections[1],
    currentDraft.sections[0],
    currentDraft.sections[2],
    {
      id: "new-section",
      type: "intro",
      enabled: true,
      translations: {},
    },
  ];

  const comparison = comparePageDrafts(previousDraft, currentDraft);

  assert.equal(comparison.isIdentical, false);
  assert.deepEqual(comparison.changedLocales, ["tr", "en"]);
  assert.equal(comparison.settingsChanged, true);
  assert.deepEqual(comparison.components, {
    added: 1,
    removed: 0,
    modified: 1,
    orderChanged: true,
  });
  assert.deepEqual(comparison.componentChanges.added, [
    {
      id: "new-section",
      type: "intro",
      label: "Giriş metni",
      position: 4,
      changeTypes: [],
    },
  ]);
  assert.equal(comparison.componentChanges.modified[0].label, "Giriş metni");
  assert.deepEqual(comparison.componentChanges.modified[0].changeTypes, ["text"]);
});

test("ekleme veya silme nedeniyle kayan componentleri sıralama değişikliği saymaz", () => {
  const previousDraft = createDraft();
  const currentDraft = structuredClone(previousDraft);
  currentDraft.sections.splice(1, 1);

  const comparison = comparePageDrafts(previousDraft, currentDraft);

  assert.equal(comparison.components.removed, 1);
  assert.equal(comparison.components.orderChanged, false);
  assert.equal(comparison.componentChanges.removed[0].label, "Görsel ve metin");
  assert.equal(comparison.componentChanges.removed[0].position, 2);
});

test("değişen componentte metin, görsel ve ayar farklarını ayırır", () => {
  const previousDraft = createDraft();
  const currentDraft = structuredClone(previousDraft);

  currentDraft.sections[1].image = "/uploads/pages/new.webp";
  currentDraft.sections[1].translations.tr.title = "Yeni başlık";
  currentDraft.sections[1].imagePosition = "right";

  const comparison = comparePageDrafts(previousDraft, currentDraft);

  assert.deepEqual(comparison.componentChanges.modified, [
    {
      id: currentDraft.sections[1].id,
      type: "imageText",
      label: "Görsel ve metin",
      position: 2,
      changeTypes: ["image", "settings", "text"],
    },
  ]);
});
