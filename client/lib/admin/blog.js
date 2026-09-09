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

export async function listBlogPosts() {
  const files = await listJsonFiles(postsDirectory);
  const posts = await Promise.all(files.map((filePath) => readJson(filePath, null)));

  return posts
    .filter(Boolean)
    .map(normalizePost)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function readBlogPost(slug) {
  const post = await readJson(getPostFilePath(slug), null);
  return post ? normalizePost(post) : null;
}

async function saveBlogPostUnlocked(post) {
  validateBlogPost(post);
  const normalized = normalizePost(post, { updateTimestamp: true });

  if (!normalized.slug) {
    throw new BlogContentError("Geçerli bir blog slug değeri girilmelidir.");
  }

  await writeJson(getPostFilePath(normalized.slug), normalized);
  return normalized;
}

async function createBlogPostUnlocked(post) {
  validateBlogPost(post);
  const normalized = normalizePost(post, { updateTimestamp: true });

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

  await writeJson(getPostFilePath(normalized.slug), normalized);
  return normalized;
}

export function createBlogPost(post) {
  return enqueueFileOperation(postsDirectory, () => createBlogPostUnlocked(post));
}

export function saveBlogPost(post) {
  return enqueueFileOperation(postsDirectory, () => saveBlogPostUnlocked(post));
}

async function deleteBlogPostUnlocked(slug) {
  const existingPost = await readBlogPost(slug);
  const managedMediaUrls = [
    existingPost?.coverImage,
    ...(existingPost?.contentBlocks || []).map((block) => block.image),
  ].filter(
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

  const coverResult = mediaResults.find(({ url }) => url === existingPost?.coverImage);
  const retainedMedia = mediaResults
    .filter(({ usages }) => usages.length > 0)
    .map(({ url, usages }) => ({ url, usages }));

  return {
    retainedCoverImage: coverResult?.usages.length ? existingPost.coverImage : null,
    usages: coverResult?.usages || [],
    retainedMedia,
  };
}

export function deleteBlogPost(slug) {
  return enqueueFileOperation(postsDirectory, () => deleteBlogPostUnlocked(slug));
}
