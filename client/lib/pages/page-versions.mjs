export const PAGE_STORAGE_VERSION = 2;

function clonePage(page) {
  return page ? JSON.parse(JSON.stringify(page)) : null;
}

function getComparablePage(page) {
  if (!page) {
    return null;
  }

  const {
    status: _status,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...content
  } = page;

  return content;
}

export function isVersionedPageRecord(value) {
  return Boolean(
    value &&
      value.storageVersion === PAGE_STORAGE_VERSION &&
      value.draft &&
      typeof value.draft === "object"
  );
}

export function normalizePageRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if (isVersionedPageRecord(value)) {
    return value;
  }

  const draft = {
    ...clonePage(value),
    status: "draft",
  };
  const published =
    value.status === "published"
      ? {
          ...clonePage(value),
          status: "published",
        }
      : null;

  return {
    storageVersion: PAGE_STORAGE_VERSION,
    id: value.id,
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || value.createdAt || null,
    publishedAt: published ? value.updatedAt || value.createdAt || null : null,
    draft,
    published,
  };
}

export function createPageRecord(draft) {
  return {
    storageVersion: PAGE_STORAGE_VERSION,
    id: draft.id,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    publishedAt: null,
    draft: {
      ...clonePage(draft),
      status: "draft",
    },
    published: null,
  };
}

export function hasUnpublishedPageChanges(record) {
  if (!record?.published) {
    return false;
  }

  return (
    JSON.stringify(getComparablePage(record.draft)) !==
    JSON.stringify(getComparablePage(record.published))
  );
}

export function createAdminPageView(record) {
  if (!record?.draft) {
    return null;
  }

  return {
    ...clonePage(record.draft),
    status: record.published ? "published" : "draft",
    hasUnpublishedChanges: hasUnpublishedPageChanges(record),
    publishedAt: record.publishedAt || null,
    publishedSlugs: clonePage(record.published?.slugs),
  };
}

export function sanitizeAdminPageInput(page) {
  if (!page || typeof page !== "object" || Array.isArray(page)) {
    return page;
  }

  const {
    hasUnpublishedChanges: _hasUnpublishedChanges,
    publishedAt: _publishedAt,
    publishedSlugs: _publishedSlugs,
    ...document
  } = page;

  return document;
}

export function publishPageRecord(record, publishedAt) {
  return {
    ...record,
    updatedAt: publishedAt,
    publishedAt,
    published: {
      ...clonePage(record.draft),
      status: "published",
    },
  };
}

export function unpublishPageRecord(record, updatedAt) {
  return {
    ...record,
    updatedAt,
    publishedAt: null,
    published: null,
  };
}

