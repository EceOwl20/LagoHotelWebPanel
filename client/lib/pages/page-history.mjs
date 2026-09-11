export const DEFAULT_PAGE_HISTORY_LIMIT = 3;

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function resolvePageHistoryLimit(environment = process.env) {
  const configuredValue = String(
    environment.PANEL_PAGE_VERSION_LIMIT ?? ""
  ).trim();

  if (!configuredValue) return DEFAULT_PAGE_HISTORY_LIMIT;

  const parsedValue = Number(configuredValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1 || parsedValue > 100) {
    throw new Error(
      "PANEL_PAGE_VERSION_LIMIT 1 ile 100 arasında bir tam sayı olmalıdır."
    );
  }

  return parsedValue;
}

function normalizeActor(actor) {
  if (!actor || typeof actor !== "object") return null;

  return {
    id: String(actor.id || ""),
    username: String(actor.username || ""),
    displayName: String(actor.displayName || actor.username || ""),
    role: String(actor.role || ""),
  };
}

export function normalizePageHistory(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.versionId === "string" &&
        entry.versionId &&
        typeof entry.createdAt === "string" &&
        !Number.isNaN(Date.parse(entry.createdAt)) &&
        entry.draft &&
        typeof entry.draft === "object" &&
        !Array.isArray(entry.draft)
    )
    .map((entry) => ({
      versionId: entry.versionId,
      createdAt: entry.createdAt,
      action: "draft-save",
      createdBy: normalizeActor(entry.createdBy),
      wasPublished: Boolean(entry.wasPublished),
      draft: cloneValue(entry.draft),
    }));
}

function getPrimaryTitle(draft) {
  for (const locale of ["tr", "en", "de", "ru"]) {
    const title = draft?.hero?.translations?.[locale]?.title;

    if (title) return title;
  }

  return "Başlıksız sayfa";
}

export function createPageHistorySummary(entry) {
  const [normalizedEntry] = normalizePageHistory([entry]);

  if (!normalizedEntry) return null;

  return {
    versionId: normalizedEntry.versionId,
    createdAt: normalizedEntry.createdAt,
    action: normalizedEntry.action,
    createdBy: normalizedEntry.createdBy
      ? {
          username: normalizedEntry.createdBy.username,
          displayName: normalizedEntry.createdBy.displayName,
          role: normalizedEntry.createdBy.role,
        }
      : null,
    wasPublished: normalizedEntry.wasPublished,
    title: getPrimaryTitle(normalizedEntry.draft),
    slugs: cloneValue(normalizedEntry.draft.slugs || {}),
    componentCount: Array.isArray(normalizedEntry.draft.sections)
      ? normalizedEntry.draft.sections.length
      : 0,
  };
}

export function createPageHistoryDetail(entry) {
  const [normalizedEntry] = normalizePageHistory([entry]);

  if (!normalizedEntry) return null;

  return {
    ...createPageHistorySummary(normalizedEntry),
    draft: cloneValue(normalizedEntry.draft),
  };
}

function getComparableDraft(draft) {
  if (!draft || typeof draft !== "object") return draft;

  const {
    status: _status,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...content
  } = draft;

  return content;
}

export function hasMeaningfulDraftChange(previousDraft, nextDraft) {
  return (
    JSON.stringify(getComparableDraft(previousDraft)) !==
    JSON.stringify(getComparableDraft(nextDraft))
  );
}

export function prependPageHistorySnapshot(
  record,
  { versionId, createdAt, createdBy, limit }
) {
  if (!record?.draft) {
    throw new Error("Geçmiş sürüm için mevcut taslak bulunamadı.");
  }

  if (!versionId || Number.isNaN(Date.parse(createdAt))) {
    throw new Error("Geçmiş sürüm kimliği ve tarihi geçerli olmalıdır.");
  }

  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("Geçmiş sürüm limiti en az 1 olmalıdır.");
  }

  const historyEntry = {
    versionId,
    createdAt,
    action: "draft-save",
    createdBy: normalizeActor(createdBy),
    wasPublished: Boolean(record.published),
    draft: cloneValue(record.draft),
  };

  return {
    ...record,
    history: [historyEntry, ...normalizePageHistory(record.history)].slice(
      0,
      limit
    ),
  };
}
