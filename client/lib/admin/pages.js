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

async function readAllPageDrafts() {
  const files = await listJsonFiles(pagesDirectory);
  const pages = await Promise.all(files.map((filePath) => readJson(filePath, null)));
  return pages.filter(Boolean);
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

function toPageSummary(page) {
  return {
    id: page.id,
    title: getPrimaryTitle(page),
    status: page.status,
    slugs: page.slugs,
    navigation: page.navigation,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}

export async function listPageDrafts() {
  const pages = await readAllPageDrafts();

  return pages
    .map(toPageSummary)
    .sort((left, right) => (right.updatedAt || "").localeCompare(left.updatedAt || ""));
}

export async function readPageDraft(id) {
  return readJson(getPageFilePath(id), null);
}

export async function readPublishedPageBySlug(locale, slug) {
  if (!PAGE_LOCALES.includes(locale) || !slug) {
    return null;
  }

  const pages = await readAllPageDrafts();
  return (
    pages.find(
      (page) => page.status === "published" && page?.slugs?.[locale] === slug
    ) || null
  );
}

export async function listPublishedPageNavigation(locale) {
  if (!PAGE_LOCALES.includes(locale)) {
    return [];
  }

  const pages = await readAllPageDrafts();

  return pages
    .filter(
      (page) =>
        page.status === "published" &&
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

  const existingPages = await readAllPageDrafts();
  const conflicts = findLocalizedSlugConflicts(existingPages, candidate, ignorePageId);

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    throw new PageDraftError(
      `${conflict.locale.toUpperCase()} slug zaten başka bir sayfada kullanılıyor: ${conflict.slug}`,
      409
    );
  }
}

export async function createPageDraft(input) {
  const candidate = {
    ...input,
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

  await writeJson(getPageFilePath(page.id), page);
  return page;
}

export async function updatePageDraft(id, input) {
  const existingPage = await readPageDraft(id);

  if (!existingPage) {
    throw new PageDraftError("Sayfa taslağı bulunamadı.", 404);
  }

  const candidate = {
    ...input,
    id,
    status: "draft",
    createdAt: existingPage.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await assertValidDraft(candidate, id);
  await writeJson(getPageFilePath(id), candidate);
  return candidate;
}

export async function deletePageDraft(id) {
  const filePath = getPageFilePath(id);
  const existingPage = await readJson(filePath, null);

  if (!existingPage) {
    throw new PageDraftError("Dinamik sayfa bulunamadı.", 404);
  }

  await removeFileIfExists(filePath);
  return existingPage;
}

export async function setPagePublicationStatus(id, status) {
  if (!["draft", "published"].includes(status)) {
    throw new PageDraftError("Geçersiz yayın durumu.");
  }

  const existingPage = await readPageDraft(id);

  if (!existingPage) {
    throw new PageDraftError("Sayfa taslağı bulunamadı.", 404);
  }

  if (status === "published") {
    const validationErrors = validatePageDocument(existingPage);

    if (validationErrors.length > 0) {
      throw new PageDraftError(
        `Sayfa yayınlanamadı: ${validationErrors.join(" ")}`
      );
    }

    const existingPages = await readAllPageDrafts();
    const conflicts = findLocalizedSlugConflicts(existingPages, existingPage, id);

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      throw new PageDraftError(
        `${conflict.locale.toUpperCase()} slug zaten başka bir sayfada kullanılıyor: ${conflict.slug}`,
        409
      );
    }
  }

  const page = {
    ...existingPage,
    status,
    updatedAt: new Date().toISOString(),
  };

  await writeJson(getPageFilePath(id), page);
  return page;
}
