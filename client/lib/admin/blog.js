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

const postsDirectory = path.join(contentRoot, "blog", "posts");

function createEmptyTranslation() {
  return {
    title: "",
    excerpt: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
  };
}

function normalizePost(post) {
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

  return {
    slug: slugify(post?.slug || primaryTitle || "blog-yazisi"),
    status: BLOG_STATUSES.includes(post?.status) ? post.status : "draft",
    coverImage: post?.coverImage || "",
    publishedAt: post?.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    translations,
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

export async function saveBlogPost(post) {
  const normalized = normalizePost(post);
  await writeJson(getPostFilePath(normalized.slug), normalized);
  return normalized;
}

export async function deleteBlogPost(slug) {
  const existingPost = await readBlogPost(slug);

  if (existingPost?.coverImage?.startsWith("/uploads/")) {
    await removeFileIfExists(getUploadFilePath(existingPost.coverImage));
  }

  await removeFileIfExists(getPostFilePath(slug));
}
