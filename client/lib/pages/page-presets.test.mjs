import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_PRESETS,
  applyPagePresetSections,
  createPageDraftFromPreset,
} from "./page-presets.mjs";
import { validatePageDocument } from "./schema.mjs";

test("sayfa presetleri benzersiz kimlikler ve geçerli taslaklar üretir", () => {
  assert.deepEqual(
    PAGE_PRESETS.map((preset) => preset.id),
    ["editorial", "blank", "cards"]
  );

  PAGE_PRESETS.forEach((preset) => {
    const draft = createPageDraftFromPreset(preset.id);
    assert.deepEqual(validatePageDocument(draft, { allowEmptySlugs: true }), []);
  });
});

test("kartlı preset giriş ve üç kartlı cardCollection ile başlar", () => {
  const draft = createPageDraftFromPreset("cards");
  const cardCollection = draft.sections.find(
    (section) => section.type === "cardCollection"
  );

  assert.deepEqual(
    draft.sections.map((section) => section.type),
    ["intro", "cardCollection"]
  );
  assert.equal(cardCollection.cards.length, 3);
  assert.deepEqual(
    cardCollection.cards.map((card) => card.order),
    [0, 1, 2]
  );
});

test("preset uygulamak sayfa ayarlarını koruyup yalnızca sectionları değiştirir", () => {
  const draft = createPageDraftFromPreset("editorial");
  draft.slugs.tr = "korunan-slug";
  draft.navigation.order = 40;

  const nextDraft = applyPagePresetSections(draft, "blank");

  assert.equal(nextDraft.slugs.tr, "korunan-slug");
  assert.equal(nextDraft.navigation.order, 40);
  assert.deepEqual(nextDraft.sections, []);
});

test("bilinmeyen sayfa presetini reddeder", () => {
  assert.throws(
    () => createPageDraftFromPreset("unknown"),
    /Bilinmeyen sayfa preseti/
  );
});
