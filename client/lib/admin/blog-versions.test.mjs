import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminBlogView,
  createBlogRecord,
  createPublishedBlogView,
  hasUnpublishedBlogChanges,
  normalizeBlogRecord,
  publishBlogRecord,
  saveBlogDraftRecord,
  unpublishBlogRecord,
} from "./blog-versions.mjs";

function createPost(overrides = {}) {
  return {
    slug: "ornek-yazi",
    status: "draft",
    coverImage: "/uploads/blog/ornek.webp",
    publishedAt: "2026-09-12T09:00:00.000Z",
    updatedAt: "2026-09-12T10:00:00.000Z",
    translations: { tr: { title: "İlk başlık" } },
    contentBlocks: [],
    ...overrides,
  };
}

test("eski yayınlanmış blog yazısını taslak ve canlı kopyaya ayırır", () => {
  const record = normalizeBlogRecord(createPost({ status: "published" }));

  assert.equal(record.storageVersion, 2);
  assert.equal(record.draft.status, "draft");
  assert.equal(record.published.status, "published");
  assert.equal(createAdminBlogView(record).status, "published");
  assert.equal(hasUnpublishedBlogChanges(record), false);
});

test("taslak kaydı yayınlanmış blog kopyasını değiştirmez", () => {
  const publishedRecord = publishBlogRecord(createBlogRecord(createPost()), "2026-09-12T11:00:00.000Z");
  const changedRecord = saveBlogDraftRecord(
    publishedRecord,
    createPost({ translations: { tr: { title: "Yeni taslak" } } }),
    "2026-09-12T12:00:00.000Z"
  );

  assert.equal(changedRecord.draft.translations.tr.title, "Yeni taslak");
  assert.equal(changedRecord.published.translations.tr.title, "İlk başlık");
  assert.equal(createPublishedBlogView(changedRecord).translations.tr.title, "İlk başlık");
  assert.equal(createAdminBlogView(changedRecord).hasUnpublishedChanges, true);
});

test("yeniden yayınlama son taslağı canlı kopyaya aktarır", () => {
  const draftRecord = saveBlogDraftRecord(
    createBlogRecord(createPost()),
    createPost({ translations: { tr: { title: "Yayınlanacak taslak" } } }),
    "2026-09-12T12:00:00.000Z"
  );
  const publishedRecord = publishBlogRecord(draftRecord, "2026-09-12T13:00:00.000Z");

  assert.equal(createPublishedBlogView(publishedRecord).translations.tr.title, "Yayınlanacak taslak");
  assert.equal(createAdminBlogView(publishedRecord).hasUnpublishedChanges, false);
});

test("yayından kaldırma canlı kopyayı silerken taslağı korur", () => {
  const publishedRecord = publishBlogRecord(createBlogRecord(createPost()), "2026-09-12T11:00:00.000Z");
  const unpublishedRecord = unpublishBlogRecord(publishedRecord, "2026-09-12T12:00:00.000Z");

  assert.equal(unpublishedRecord.published, null);
  assert.equal(unpublishedRecord.draft.translations.tr.title, "İlk başlık");
  assert.equal(createAdminBlogView(unpublishedRecord).status, "draft");
});
