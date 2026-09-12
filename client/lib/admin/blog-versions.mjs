export const BLOG_STORAGE_VERSION = 2;

function clonePost(post) {
  return post ? JSON.parse(JSON.stringify(post)) : null;
}

function getComparablePost(post) {
  if (!post) return null;

  const {
    status: _status,
    updatedAt: _updatedAt,
    hasUnpublishedChanges: _hasUnpublishedChanges,
    ...content
  } = post;

  return content;
}

export function isVersionedBlogRecord(value) {
  return Boolean(
    value &&
      value.storageVersion === BLOG_STORAGE_VERSION &&
      value.draft &&
      typeof value.draft === "object"
  );
}

export function normalizeBlogRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if (isVersionedBlogRecord(value)) {
    return {
      ...clonePost(value),
      draft: { ...clonePost(value.draft), status: "draft" },
      published: value.published
        ? { ...clonePost(value.published), status: "published" }
        : null,
    };
  }

  const draft = { ...clonePost(value), status: "draft" };
  const published =
    value.status === "published"
      ? { ...clonePost(value), status: "published" }
      : null;

  return {
    storageVersion: BLOG_STORAGE_VERSION,
    slug: value.slug,
    createdAt: value.createdAt || value.updatedAt || null,
    updatedAt: value.updatedAt || value.createdAt || null,
    publicationUpdatedAt: published
      ? value.updatedAt || value.createdAt || null
      : null,
    draft,
    published,
  };
}

export function createBlogRecord(draft, { publish = false } = {}) {
  const timestamp = draft.updatedAt || new Date().toISOString();

  return {
    storageVersion: BLOG_STORAGE_VERSION,
    slug: draft.slug,
    createdAt: draft.createdAt || timestamp,
    updatedAt: timestamp,
    publicationUpdatedAt: publish ? timestamp : null,
    draft: { ...clonePost(draft), status: "draft" },
    published: publish
      ? { ...clonePost(draft), status: "published" }
      : null,
  };
}

export function hasUnpublishedBlogChanges(record) {
  if (!record?.published) return false;

  return (
    JSON.stringify(getComparablePost(record.draft)) !==
    JSON.stringify(getComparablePost(record.published))
  );
}

export function createAdminBlogView(record) {
  if (!record?.draft) return null;

  return {
    ...clonePost(record.draft),
    status: record.published ? "published" : "draft",
    hasUnpublishedChanges: hasUnpublishedBlogChanges(record),
  };
}

export function createPublishedBlogView(record) {
  return record?.published
    ? { ...clonePost(record.published), status: "published" }
    : null;
}

export function sanitizeAdminBlogInput(post) {
  if (!post || typeof post !== "object" || Array.isArray(post)) return post;

  const {
    hasUnpublishedChanges: _hasUnpublishedChanges,
    ...content
  } = post;

  return content;
}

export function saveBlogDraftRecord(record, draft, updatedAt) {
  return {
    ...record,
    updatedAt,
    draft: {
      ...clonePost(draft),
      status: "draft",
      updatedAt,
    },
  };
}

export function publishBlogRecord(record, publishedAt) {
  return {
    ...record,
    updatedAt: publishedAt,
    publicationUpdatedAt: publishedAt,
    published: {
      ...clonePost(record.draft),
      status: "published",
    },
  };
}

export function unpublishBlogRecord(record, updatedAt) {
  return {
    ...record,
    updatedAt,
    publicationUpdatedAt: null,
    published: null,
  };
}
