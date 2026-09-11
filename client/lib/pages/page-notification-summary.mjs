import { PAGE_LOCALES } from "./schema.mjs";

export const DEFAULT_PAGE_NOTIFICATION_LIMIT = 5;

function getPrimaryTitle(page) {
  for (const locale of PAGE_LOCALES) {
    const title = String(page?.hero?.translations?.[locale]?.title || "").trim();

    if (title) return title;
  }

  return "Başlıksız sayfa";
}

export function createPageNotificationSummary(
  records,
  { limit = DEFAULT_PAGE_NOTIFICATION_LIMIT } = {}
) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
    throw new TypeError("Bildirim özeti limiti 1 ile 20 arasında olmalıdır.");
  }

  const drafts = (Array.isArray(records) ? records : [])
    .filter((record) => record?.draft && !record.published)
    .map((record) => ({
      id: record.id,
      title: getPrimaryTitle(record.draft),
      updatedAt: record.updatedAt || record.draft.updatedAt || null,
    }))
    .sort((left, right) =>
      (right.updatedAt || "").localeCompare(left.updatedAt || "")
    );

  return {
    draftCount: drafts.length,
    drafts: drafts.slice(0, limit),
  };
}
