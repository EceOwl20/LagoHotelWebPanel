import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdminPageView,
  createPageRecord,
  hasUnpublishedPageChanges,
  normalizePageRecord,
  publishPageRecord,
  sanitizeAdminPageInput,
  unpublishPageRecord,
} from "./page-versions.mjs";

function createPage(overrides = {}) {
  return {
    id: "page-id",
    schemaVersion: 1,
    template: "standard",
    slugs: { tr: "ornek", en: "example", de: "beispiel", ru: "пример" },
    status: "draft",
    hero: { translations: { tr: { title: "İlk başlık" } } },
    sections: [],
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

test("eski yayınlanmış sayfayı çalışma ve canlı kopyaya ayırır", () => {
  const legacyPage = createPage({ status: "published" });
  const record = normalizePageRecord(legacyPage);

  assert.equal(record.storageVersion, 2);
  assert.equal(record.draft.status, "draft");
  assert.equal(record.published.status, "published");
  assert.equal(createAdminPageView(record).status, "published");
  assert.equal(hasUnpublishedPageChanges(record), false);
});

test("taslak değişikliği yayınlanan kopyayı değiştirmez", () => {
  const initialRecord = createPageRecord(createPage());
  const publishedRecord = publishPageRecord(
    initialRecord,
    "2026-01-01T11:00:00.000Z"
  );
  const changedRecord = {
    ...publishedRecord,
    draft: {
      ...publishedRecord.draft,
      hero: { translations: { tr: { title: "Yeni taslak başlığı" } } },
      updatedAt: "2026-01-01T12:00:00.000Z",
    },
  };

  assert.equal(changedRecord.published.hero.translations.tr.title, "İlk başlık");
  assert.equal(createAdminPageView(changedRecord).status, "published");
  assert.equal(createAdminPageView(changedRecord).hasUnpublishedChanges, true);
});

test("yeniden yayınlama çalışma kopyasını canlı kopyaya aktarır", () => {
  const record = createPageRecord(createPage());
  record.draft.hero.translations.tr.title = "Yayınlanacak başlık";

  const publishedRecord = publishPageRecord(record, "2026-01-01T13:00:00.000Z");

  assert.equal(
    publishedRecord.published.hero.translations.tr.title,
    "Yayınlanacak başlık"
  );
  assert.equal(hasUnpublishedPageChanges(publishedRecord), false);
  assert.equal(createAdminPageView(publishedRecord).publishedAt, "2026-01-01T13:00:00.000Z");
});

test("yayından kaldırma taslağı koruyup yalnızca canlı kopyayı temizler", () => {
  const publishedRecord = publishPageRecord(
    createPageRecord(createPage()),
    "2026-01-01T13:00:00.000Z"
  );
  const draftRecord = unpublishPageRecord(
    publishedRecord,
    "2026-01-01T14:00:00.000Z"
  );

  assert.equal(draftRecord.published, null);
  assert.equal(draftRecord.draft.hero.translations.tr.title, "İlk başlık");
  assert.equal(createAdminPageView(draftRecord).status, "draft");
});

test("panel metadatasını sayfa dokümanına kaydetmeden temizler", () => {
  const page = createAdminPageView(
    publishPageRecord(createPageRecord(createPage()), "2026-01-01T13:00:00.000Z")
  );
  const sanitized = sanitizeAdminPageInput(page);

  assert.equal("hasUnpublishedChanges" in sanitized, false);
  assert.equal("publishedAt" in sanitized, false);
  assert.equal("publishedSlugs" in sanitized, false);
});

