export const revision = "a".repeat(64);
export const nextRevision = "b".repeat(64);
export const time = "2026-09-28T10:05:12.123Z";
export function input() {
  return { coverImage: "", publishedAt: time, contentBlocks: [], translations: Object.fromEntries(
    ["tr", "en", "de", "ru"].map((l) => [l, { title: `${l} title`, excerpt: "", content: "Paragraph one\n\nParagraph two", seoTitle: "", seoDescription: "" }])) };
}
export function record(slug = "azura-post", published = false) {
  const draft = { ...input(), slug, status: "draft", updatedAt: time };
  return { storageVersion: 2, slug, createdAt: time, updatedAt: time, publicationUpdatedAt: published ? time : null,
    draft, published: published ? { ...structuredClone(draft), status: "published" } : null };
}
export function view(slug = "azura-post", published = false, rev = revision) {
  return { ...record(slug).draft, status: published ? "published" : "draft", hasUnpublishedChanges: false,
    revision: rev, mediaOrigin: "https://azura.test" };
}
