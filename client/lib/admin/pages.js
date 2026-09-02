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
  sanitizeAdminPageInput,
  unpublishPageRecord,
} from "@/lib/pages/page-versions.mjs";
import {
  contentRoot,
  listJsonFiles,
  readJson,
  removeFileIfExists,
  writeJson,
} from "./storage";

const pagesDirectory = path.join(contentRoot, "pages");

export class PageDraftError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PageDraftError";
    this.status = status;
  }
}

function getPageFilePath(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new PageDraftError("Geçersiz sayfa kimliği.");
  }

  return path.join(pagesDirectory, `${id}.json`);
}

async function readAllPageRecords() {
  const files = await listJsonFiles(pagesDirectory);
  const storedPages = await Promise.all(
    files.map((filePath) => readJson(filePath, null))
  );

  return storedPages.map(normalizePageRecord).filter(Boolean);
}

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

export async function readPageDraft(id) {
  const record = await readPageRecord(id);
  return createAdminPageView(record);
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
  const validationErrors = validatePageDocument(candidate, { allowEmptySlugs: true });

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

export async function createPageDraft(input) {
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
  return createAdminPageView(record);
}

export async function updatePageDraft(id, input) {
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
  const record = {
    ...existingRecord,
    updatedAt: timestamp,
    draft: candidate,
  };

  await writeJson(getPageFilePath(id), record);
  return createAdminPageView(record);
}

export async function deletePageDraft(id) {
  const filePath = getPageFilePath(id);
  const existingRecord = normalizePageRecord(await readJson(filePath, null));

  if (!existingRecord) {
    throw new PageDraftError("Dinamik sayfa bulunamadı.", 404);
  }

  await removeFileIfExists(filePath);
  return createAdminPageView(existingRecord);
}

export async function setPagePublicationStatus(id, status) {
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
  return createAdminPageView(record);
}
