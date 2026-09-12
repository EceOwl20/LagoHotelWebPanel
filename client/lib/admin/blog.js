import "server-only";

import path from "path";
import { BLOG_STATUSES, CMS_LOCALES } from "./constants";
import {
  contentRoot,
  getUploadFilePath,
  listJsonFiles,
  readJson,
  removeFileIfExists,
  slugify,
  writeJson,
} from "./storage";
import { findManagedMediaUsage } from "./media-usage";
import { enqueueFileOperation } from "./file-operation-queue.mjs";
import { getBlogPostValidationError } from "./blog-policy.mjs";
import { normalizeBlogContentBlocks } from "./blog-blocks.mjs";
import {
  createAdminBlogView,
  createBlogRecord,
  createPublishedBlogView,
  normalizeBlogRecord,
  publishBlogRecord,
  sanitizeAdminBlogInput,
  saveBlogDraftRecord,
  unpublishBlogRecord,
} from "./blog-versions.mjs";

const postsDirectory = path.join(contentRoot, "blog", "posts");

export class BlogContentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "BlogContentError";
    this.status = status;
  }
}

function createEmptyTranslation() {
  return {
    title: "",
    excerpt: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
  };
}

function validateBlogPost(post) {
  const validationError = getBlogPostValidationError(post);
  if (validationError) throw new BlogContentError(validationError);
}

function normalizePost(post, { updateTimestamp = false } = {}) {
  const translations = {};

  for (const locale of CMS_LOCALES) {
    translations[locale] = {
      ...createEmptyTranslation(),
      ...(post?.translations?.[locale] || {}),
    };
  }

  const primaryTitle =
    translations.tr.title ||
    translations.en.title ||
    translations.de.title ||
    translations.ru.title ||
    "";

  const parsedPublishedAt = Date.parse(post?.publishedAt);

  return {
    slug: slugify(post?.slug || primaryTitle || "blog-yazisi"),
    status: BLOG_STATUSES.includes(post?.status) ? post.status : "draft",
    coverImage: post?.coverImage || "",
    publishedAt: Number.isNaN(parsedPublishedAt)
      ? new Date().toISOString()
      : new Date(parsedPublishedAt).toISOString(),
    updatedAt: updateTimestamp
      ? new Date().toISOString()
      : post?.updatedAt || new Date().toISOString(),
    translations,
    contentBlocks: normalizeBlogContentBlocks(post?.contentBlocks),
  };
}

function getPostFilePath(slug) {
  return path.join(postsDirectory, `${slug}.json`);
}

function normalizeStoredRecord(storedValue) {
  const record = normalizeBlogRecord(storedValue);
  if (!record) return null;

  return {
    ...record,
    draft: normalizePost(record.draft),
    published: record.published ? normalizePost(record.published) : null,
  };
}

async function readAllBlogRecords() {
  const files = await listJsonFiles(postsDirectory);
  const storedRecords = await Promise.all(
    files.map((filePath) => readJson(filePath, null))
  );

  return storedRecords.map(normalizeStoredRecord).filter(Boolean);
}

async function readBlogRecord(slug) {
  const storedValue = await readJson(getPostFilePath(slug), null);
  return normalizeStoredRecord(storedValue);
}

export async function listBlogPosts() {
  const records = await readAllBlogRecords();

  return records
    .map(createAdminBlogView)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function readBlogPost(slug) {
  return createAdminBlogView(await readBlogRecord(slug));
}

export async function listPublishedBlogPosts() {
  const records = await readAllBlogRecords();

  return records
    .map(createPublishedBlogView)
    .filter(Boolean)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function readPublishedBlogPost(slug) {
  return createPublishedBlogView(await readBlogRecord(slug));
}

async function saveBlogPostUnlocked(post, { publicationStatus } = {}) {
  if (
    publicationStatus !== undefined &&
    !BLOG_STATUSES.includes(publicationStatus)
  ) {
    throw new BlogContentError("Geçersiz blog yayın durumu.");
  }

  const sanitizedPost = sanitizeAdminBlogInput(post);
  const normalized = normalizePost(
    { ...sanitizedPost, status: "draft" },
    { updateTimestamp: true }
  );
  validateBlogPost(normalized);

  if (!normalized.slug) {
    throw new BlogContentError("Geçerli bir blog slug değeri girilmelidir.");
  }

  const existingRecord = await readBlogRecord(normalized.slug);

  if (!existingRecord) {
    throw new BlogContentError("Blog yazısı bulunamadı.", 404);
  }

  let record = saveBlogDraftRecord(
    existingRecord,
    normalized,
    normalized.updatedAt
  );

  if (publicationStatus === "published") {
    record = publishBlogRecord(record, normalized.updatedAt);
  } else if (publicationStatus === "draft") {
    record = unpublishBlogRecord(record, normalized.updatedAt);
  }

  await writeJson(getPostFilePath(normalized.slug), record);
  return createAdminBlogView(record);
}

async function createBlogPostUnlocked(post) {
  const sanitizedPost = sanitizeAdminBlogInput(post);
  const normalized = normalizePost(sanitizedPost, { updateTimestamp: true });
  validateBlogPost(normalized);

  if (!normalized.slug) {
    throw new BlogContentError("Geçerli bir blog slug değeri girilmelidir.");
  }

  const existingPost = await readJson(getPostFilePath(normalized.slug), null);

  if (existingPost) {
    throw new BlogContentError(
      "Bu slug ile kayıtlı bir blog yazısı zaten bulunuyor.",
      409
    );
  }

  const record = createBlogRecord(normalized, {
    publish: normalized.status === "published",
  });
  await writeJson(getPostFilePath(normalized.slug), record);
  return createAdminBlogView(record);
}

export function createBlogPost(post) {
  return enqueueFileOperation(postsDirectory, () => createBlogPostUnlocked(post));
}

export function saveBlogPost(post, options) {
  return enqueueFileOperation(postsDirectory, () =>
    saveBlogPostUnlocked(post, options)
  );
}

async function deleteBlogPostUnlocked(slug) {
  const existingRecord = await readBlogRecord(slug);

  if (!existingRecord) {
    throw new BlogContentError("Blog yazısı bulunamadı.", 404);
  }

  const storedPosts = [existingRecord.draft, existingRecord.published].filter(Boolean);

  const managedMediaUrls = storedPosts.flatMap((post) => [
    post.coverImage,
    ...(post.contentBlocks || []).map((block) => block.image),
  ]).filter(
    (url, index, urls) =>
      url?.startsWith("/uploads/") && urls.indexOf(url) === index
  );

  const mediaResults = await Promise.all(
    managedMediaUrls.map(async (url) => ({
      url,
      usages: await findManagedMediaUsage(url, {
        excludeSourceIds: [`blog:${slug}`],
      }),
    }))
  );

  await removeFileIfExists(getPostFilePath(slug));

  await Promise.all(
    mediaResults
      .filter(({ usages }) => usages.length === 0)
      .map(({ url }) => removeFileIfExists(getUploadFilePath(url)))
  );

  const coverResult = mediaResults.find(
    ({ url }) => url === existingRecord.draft.coverImage
  );
  const retainedMedia = mediaResults
    .filter(({ usages }) => usages.length > 0)
    .map(({ url, usages }) => ({ url, usages }));

  return {
    retainedCoverImage: coverResult?.usages.length
      ? existingRecord.draft.coverImage
      : null,
    usages: coverResult?.usages || [],
    retainedMedia,
  };
}

export function deleteBlogPost(slug) {
  return enqueueFileOperation(postsDirectory, () => deleteBlogPostUnlocked(slug));
}
