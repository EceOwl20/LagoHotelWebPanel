import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import {
  PAGE_LOCALES,
  findLocalizedSlugConflicts,
  getLocalizedContent,
  validatePageDocument,
} from "@/lib/pages/schema.mjs";
import {
  createAdminPageView,
  createPageRecord,
  normalizePageRecord,
  publishPageRecord,
  restorePageRecordAsDraft,
  sanitizeAdminPageInput,
  unpublishPageRecord,
} from "@/lib/pages/page-versions.mjs";
import {
  contentRoot,
  listJsonFiles,
  readJson,
  trashRoot,
  writeJson,
} from "./storage";
import { enqueueFileOperation } from "./file-operation-queue.mjs";
import { createAsyncCache } from "./async-cache.mjs";
import {
  listJsonTrashEntries,
  moveJsonFileToTrash,
  readJsonTrashEntry,
  removeJsonTrashEntry,
  restoreJsonTrashEntry,
  TrashStoreError,
} from "./trash-store.mjs";
import { isPermanentDeleteConfirmed } from "./trash-policy.mjs";
import {
  createPageHistoryDetail,
  createPageHistorySummary,
  hasMeaningfulDraftChange,
  prependPageHistorySnapshot,
  resolvePageHistoryLimit,
} from "@/lib/pages/page-history.mjs";
import { createPageNotificationSummary } from "@/lib/pages/page-notification-summary.mjs";

const pagesDirectory = path.join(contentRoot, "pages");
const trashedPagesDirectory = path.join(trashRoot, "pages");
const PAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_HISTORY_VERSION_ID_PATTERN = PAGE_ID_PATTERN;

export class PageDraftError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PageDraftError";
    this.status = status;
  }
}

function getPageFilePath(id) {
  if (!PAGE_ID_PATTERN.test(id)) {
    throw new PageDraftError("Geçersiz sayfa kimliği.");
  }

  return path.join(pagesDirectory, `${id}.json`);
}

function getTrashedPageDirectory(id) {
  getPageFilePath(id);
  return path.join(trashedPagesDirectory, id);
}

async function readAllPageRecords() {
  const files = await listJsonFiles(pagesDirectory);
  const storedPages = await Promise.all(
    files.map((filePath) => readJson(filePath, null))
  );

  return storedPages.map(normalizePageRecord).filter(Boolean);
}

const pageNotificationSummaryCache = createAsyncCache({
  load: async () => createPageNotificationSummary(await readAllPageRecords()),
  ttlMs: 30_000,
});

async function readPageRecord(id) {
  const storedPage = await readJson(getPageFilePath(id), null);
  return normalizePageRecord(storedPage);
}

function getConflictCandidates(records) {
  return records.flatMap((record) =>
    [record.draft, record.published].filter(Boolean)
  );
}

function getPrimaryTitle(page) {
  for (const locale of PAGE_LOCALES) {
    const title = page?.hero?.translations?.[locale]?.title;

    if (title) {
      return title;
    }
  }

  return "Başlıksız sayfa";
}

function toPageSummary(record) {
  const page = createAdminPageView(record);

  return {
    id: page.id,
    title: getPrimaryTitle(page),
    status: page.status,
    hasUnpublishedChanges: page.hasUnpublishedChanges,
    slugs: page.slugs,
    publishedSlugs: page.publishedSlugs,
    navigation: page.navigation,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
  };
}

export async function listPageDrafts() {
  const records = await readAllPageRecords();

  return records
    .map(toPageSummary)
    .sort((left, right) => (right.updatedAt || "").localeCompare(left.updatedAt || ""));
}

export async function readPageNotificationSummary() {
  return pageNotificationSummaryCache.get();
}

export async function listTrashedPageDrafts() {
  const entries = await listJsonTrashEntries(trashedPagesDirectory);

  return entries
    .map(({ entryId, resource, metadata }) => {
      if (!PAGE_ID_PATTERN.test(entryId)) return null;

      const record = normalizePageRecord(resource);
      if (!record || record.id !== entryId) return null;

      const hasMatchingMetadata =
        metadata?.resourceType === "dynamic-page" &&
        metadata.resourceId === entryId;
      const deletedAt = hasMatchingMetadata ? metadata.deletedAt : null;

      return {
        ...toPageSummary(record),
        deletedAt:
          deletedAt && !Number.isNaN(Date.parse(deletedAt)) ? deletedAt : null,
        deletedBy: hasMatchingMetadata
          ? normalizeDeletedBy(metadata.deletedBy)
          : null,
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      (right.deletedAt || "").localeCompare(left.deletedAt || "")
    );
}

export async function readPageDraft(id) {
  const record = await readPageRecord(id);
  return createAdminPageView(record);
}

export async function listPageHistory(id) {
  const record = await readPageRecord(id);

  if (!record) {
    throw new PageDraftError("Sayfa taslağı bulunamadı.", 404);
  }

  return {
    page: {
      id: record.id,
      title: getPrimaryTitle(record.draft),
    },
    limit: resolvePageHistoryLimit(process.env),
    versions: record.history.map(createPageHistorySummary).filter(Boolean),
  };
}

export async function readPageHistoryVersion(id, versionId) {
  if (!PAGE_HISTORY_VERSION_ID_PATTERN.test(versionId)) {
    throw new PageDraftError("Geçersiz geçmiş sürüm kimliği.");
  }

  const record = await readPageRecord(id);

  if (!record) {
    throw new PageDraftError("Sayfa taslağı bulunamadı.", 404);
  }

  const historyEntry = record.history.find(
    (entry) => entry.versionId === versionId
  );
  const version = createPageHistoryDetail(historyEntry);

  if (!version) {
    throw new PageDraftError("Geçmiş sürüm bulunamadı.", 404);
  }

  return {
    page: {
      id: record.id,
      title: getPrimaryTitle(record.draft),
      updatedAt: record.updatedAt,
    },
    version,
  };
}

export async function readPublishedPageBySlug(locale, slug) {
  if (!PAGE_LOCALES.includes(locale) || !slug) {
    return null;
  }

  const records = await readAllPageRecords();
  return records.find((record) => record.published?.slugs?.[locale] === slug)
    ?.published || null;
}

export async function listPublishedPageNavigation(locale) {
  if (!PAGE_LOCALES.includes(locale)) {
    return [];
  }

  const records = await readAllPageRecords();

  return records
    .map((record) => record.published)
    .filter(Boolean)
    .filter(
      (page) =>
        page.navigation?.visible !== false &&
        page.slugs?.[locale]
    )
    .map((page) => {
      const navigation = getLocalizedContent(page.navigation?.translations, locale);
      const hero = getLocalizedContent(page.hero?.translations, locale);
      const slug = page.slugs[locale];

      return {
        id: page.id,
        label: navigation.label || hero.title || slug,
        href: `/${locale}/${slug}`,
        order: Number.isFinite(page.navigation?.order) ? page.navigation.order : 100,
      };
    })
    .sort(
      (left, right) =>
        left.order - right.order || left.label.localeCompare(right.label, locale)
    );
}

async function assertValidDraft(candidate, ignorePageId = null) {
  const validationErrors = validatePageDocument(candidate);

  if (validationErrors.length > 0) {
    throw new PageDraftError(validationErrors.join(" "));
  }

  const existingRecords = await readAllPageRecords();
  const conflicts = findLocalizedSlugConflicts(
    getConflictCandidates(existingRecords),
    candidate,
    ignorePageId
  );

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    throw new PageDraftError(
      `${conflict.locale.toUpperCase()} slug zaten başka bir sayfada kullanılıyor: ${conflict.slug}`,
      409
    );
  }
}

async function createPageDraftUnlocked(input) {
  const sanitizedInput = sanitizeAdminPageInput(input);
  const candidate = {
    ...sanitizedInput,
    status: "draft",
  };
  await assertValidDraft(candidate);

  const timestamp = new Date().toISOString();
  const page = {
    ...candidate,
    id: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const record = createPageRecord(page);
  await writeJson(getPageFilePath(page.id), record);
  pageNotificationSummaryCache.invalidate();
  return createAdminPageView(record);
}

export function createPageDraft(input) {
  return enqueueFileOperation(pagesDirectory, () => createPageDraftUnlocked(input));
}

async function savePageDraftUnlocked(
  id,
  input,
  { updatedBy, publicationStatus } = {}
) {
  if (
    publicationStatus !== undefined &&
    !["draft", "published"].includes(publicationStatus)
  ) {
    throw new PageDraftError("Geçersiz yayın durumu.");
  }

  const existingRecord = await readPageRecord(id);

  if (!existingRecord) {
    throw new PageDraftError("Sayfa taslağı bulunamadı.", 404);
  }

  const sanitizedInput = sanitizeAdminPageInput(input);
  const timestamp = new Date().toISOString();
  const candidate = {
    ...sanitizedInput,
    id,
    status: "draft",
    createdAt: existingRecord.createdAt,
    updatedAt: timestamp,
  };

  await assertValidDraft(candidate, id);
  let record = existingRecord;

  if (hasMeaningfulDraftChange(existingRecord.draft, candidate)) {
    record = prependPageHistorySnapshot(existingRecord, {
      versionId: randomUUID(),
      createdAt: timestamp,
      createdBy: updatedBy,
      limit: resolvePageHistoryLimit(process.env),
    });
  }

  record = {
    ...record,
    updatedAt: timestamp,
    draft: candidate,
  };

  if (publicationStatus === "published") {
    record = publishPageRecord(record, timestamp);
  } else if (publicationStatus === "draft") {
    record = unpublishPageRecord(record, timestamp);
  }

  await writeJson(getPageFilePath(id), record);
  pageNotificationSummaryCache.invalidate();
  return {
    page: createAdminPageView(record),
    previousPublishedSlugs: existingRecord.published?.slugs || null,
  };
}

export function savePageDraft(id, input, options) {
  return enqueueFileOperation(pagesDirectory, () =>
    savePageDraftUnlocked(id, input, options)
  );
}

export async function updatePageDraft(id, input, options) {
  const result = await savePageDraft(id, input, options);
  return result.page;
}

function normalizeDeletedBy(actor) {
  if (!actor || typeof actor !== "object") {
    return null;
  }

  return {
    id: String(actor.id || ""),
    username: String(actor.username || ""),
    displayName: String(actor.displayName || actor.username || ""),
    role: String(actor.role || ""),
  };
}

async function deletePageDraftUnlocked(id, { deletedBy } = {}) {
  const filePath = getPageFilePath(id);
  const existingRecord = normalizePageRecord(await readJson(filePath, null));

  if (!existingRecord) {
    throw new PageDraftError("Dinamik sayfa bulunamadı.", 404);
  }

  const deletedPage = createAdminPageView(existingRecord);

  try {
    await moveJsonFileToTrash({
      sourcePath: filePath,
      trashEntryDirectory: path.join(trashedPagesDirectory, id),
      metadata: {
        schemaVersion: 1,
        resourceType: "dynamic-page",
        resourceId: id,
        resourceTitle: getPrimaryTitle(deletedPage),
        deletedAt: new Date().toISOString(),
        deletedBy: normalizeDeletedBy(deletedBy),
      },
    });
  } catch (error) {
    if (error instanceof TrashStoreError && error.code === "TRASH_ENTRY_EXISTS") {
      throw new PageDraftError(error.message, 409);
    }

    throw error;
  }

  pageNotificationSummaryCache.invalidate();
  return deletedPage;
}

export function deletePageDraft(id, options) {
  return enqueueFileOperation(pagesDirectory, () =>
    deletePageDraftUnlocked(id, options)
  );
}

async function restorePageDraftUnlocked(id) {
  const filePath = getPageFilePath(id);

  if (await readPageRecord(id)) {
    throw new PageDraftError(
      "Aynı kimliğe sahip aktif bir sayfa zaten bulunuyor.",
      409
    );
  }

  const trashEntryDirectory = getTrashedPageDirectory(id);
  const { resource } = await readJsonTrashEntry(trashEntryDirectory);
  const trashedRecord = normalizePageRecord(resource);

  if (!trashedRecord || trashedRecord.id !== id) {
    throw new PageDraftError("Çöp kutusunda bu sayfa bulunamadı.", 404);
  }

  const restoredRecord = restorePageRecordAsDraft(
    trashedRecord,
    new Date().toISOString()
  );
  await assertValidDraft(restoredRecord.draft);

  try {
    await restoreJsonTrashEntry({
      trashEntryDirectory,
      targetPath: filePath,
      resource: restoredRecord,
    });
  } catch (error) {
    if (
      error instanceof TrashStoreError &&
      error.code === "RESTORE_TARGET_EXISTS"
    ) {
      throw new PageDraftError(error.message, 409);
    }

    throw error;
  }

  pageNotificationSummaryCache.invalidate();
  return createAdminPageView(restoredRecord);
}

export function restorePageDraft(id) {
  return enqueueFileOperation(pagesDirectory, () =>
    restorePageDraftUnlocked(id)
  );
}

async function permanentlyDeleteTrashedPageUnlocked(id, confirmation) {
  if (!isPermanentDeleteConfirmed(confirmation)) {
    throw new PageDraftError(
      "Kalıcı silme için onay ifadesini eksiksiz girin."
    );
  }

  const trashEntryDirectory = getTrashedPageDirectory(id);
  const { resource } = await readJsonTrashEntry(trashEntryDirectory);
  const trashedRecord = normalizePageRecord(resource);

  if (!trashedRecord || trashedRecord.id !== id) {
    throw new PageDraftError("Çöp kutusunda bu sayfa bulunamadı.", 404);
  }

  await removeJsonTrashEntry(trashEntryDirectory);
  return toPageSummary(trashedRecord);
}

export function permanentlyDeleteTrashedPage(id, confirmation) {
  return enqueueFileOperation(pagesDirectory, () =>
    permanentlyDeleteTrashedPageUnlocked(id, confirmation)
  );
}

async function setPagePublicationStatusUnlocked(id, status) {
  if (!["draft", "published"].includes(status)) {
    throw new PageDraftError("Geçersiz yayın durumu.");
  }

  const existingRecord = await readPageRecord(id);

  if (!existingRecord) {
    throw new PageDraftError("Sayfa taslağı bulunamadı.", 404);
  }

  if (status === "published") {
    const validationErrors = validatePageDocument(existingRecord.draft);

    if (validationErrors.length > 0) {
      throw new PageDraftError(
        `Sayfa yayınlanamadı: ${validationErrors.join(" ")}`
      );
    }

    const existingRecords = await readAllPageRecords();
    const conflicts = findLocalizedSlugConflicts(
      getConflictCandidates(existingRecords),
      existingRecord.draft,
      id
    );

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      throw new PageDraftError(
        `${conflict.locale.toUpperCase()} slug zaten başka bir sayfada kullanılıyor: ${conflict.slug}`,
        409
      );
    }
  }

  const timestamp = new Date().toISOString();
  const record =
    status === "published"
      ? publishPageRecord(existingRecord, timestamp)
      : unpublishPageRecord(existingRecord, timestamp);

  await writeJson(getPageFilePath(id), record);
  pageNotificationSummaryCache.invalidate();
  return createAdminPageView(record);
}

export function setPagePublicationStatus(id, status) {
  return enqueueFileOperation(pagesDirectory, () =>
    setPagePublicationStatusUnlocked(id, status)
  );
}
