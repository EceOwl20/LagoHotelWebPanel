import { createPageDraftFromPreset } from "../../lib/pages/page-presets.mjs";
import { pageDraftInput } from "../../lib/admin/azura-pages-client.mjs";
export const id = "12345678-1234-1234-1234-123456789abc";
export const revision = "a".repeat(64);
export const nextRevision = "b".repeat(64);
export function record() {
  const draft = createPageDraftFromPreset("editorial");
  Object.assign(draft, { id, status: "draft", createdAt: "2026-09-29T00:00:00.000Z", updatedAt: "2026-09-29T00:00:00.000Z" });
  draft.slugs = { tr: "ornek", en: "example", de: "beispiel", ru: "пример" };
  for (const translation of Object.values(draft.hero.translations)) translation.eyebrow = "Azura Deluxe Hotel";
  return { storageVersion: 2, id, createdAt: draft.createdAt, updatedAt: draft.updatedAt, publishedAt: null, history: [], draft, published: null };
}
export const input = () => pageDraftInput(record().draft);
export const result = (rev = revision) => ({ record: record(), page: record().draft, revision: rev, mediaOrigin: "https://azura.test" });
