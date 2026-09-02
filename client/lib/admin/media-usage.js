import "server-only";

import path from "path";
import { CMS_LOCALES } from "./constants";
import {
  contentRoot,
  listJsonFiles,
  messagesRoot,
  readJson,
} from "./storage";
import { findMediaReferencesInSources } from "./media-references.mjs";
import { normalizePageRecord } from "@/lib/pages/page-versions.mjs";

const SOURCE_DIRECTORIES = {
  pages: path.join(contentRoot, "pages"),
  sitePages: path.join(contentRoot, "site-pages"),
  blogPosts: path.join(contentRoot, "blog", "posts"),
};

function firstText(values, fallback) {
  return values.find((value) => typeof value === "string" && value.trim()) || fallback;
}

async function readSourcesFromDirectory(directory, createSource) {
  const files = await listJsonFiles(directory);
  const documents = await Promise.all(files.map((filePath) => readJson(filePath, null)));

  return documents.flatMap((document, index) =>
    document ? [createSource(document, files[index])] : []
  );
}

async function readDynamicPageSources() {
  return readSourcesFromDirectory(SOURCE_DIRECTORIES.pages, (storedPage, filePath) => {
    const record = normalizePageRecord(storedPage);
    const page = record?.draft || storedPage;

    return {
      id: `dynamic-page:${page.id || path.basename(filePath, ".json")}`,
      type: "dynamicPage",
      label: `Dinamik sayfa: ${firstText(
        CMS_LOCALES.map((locale) => page.hero?.translations?.[locale]?.title),
        path.basename(filePath, ".json")
      )}`,
      content: storedPage,
    };
  });
}

async function readSitePageSources() {
  return readSourcesFromDirectory(SOURCE_DIRECTORIES.sitePages, (page, filePath) => {
    const pageKey = page.pageKey || path.basename(filePath, ".json");

    return {
      id: `site-page:${pageKey}`,
      type: "sitePage",
      label: `Mevcut sayfa medyası: ${pageKey}`,
      content: page,
    };
  });
}

async function readBlogSources() {
  return readSourcesFromDirectory(SOURCE_DIRECTORIES.blogPosts, (post, filePath) => {
    const slug = post.slug || path.basename(filePath, ".json");

    return {
      id: `blog:${slug}`,
      type: "blog",
      label: `Blog: ${firstText(
        CMS_LOCALES.map((locale) => post.translations?.[locale]?.title),
        slug
      )}`,
      content: post,
    };
  });
}

async function readMessageSources() {
  return Promise.all(
    CMS_LOCALES.map(async (locale) => ({
      id: `messages:${locale}`,
      type: "messages",
      label: `${locale.toUpperCase()} çeviri içerikleri`,
      content: await readJson(path.join(messagesRoot, `${locale}.json`), {}),
    }))
  );
}

async function readGallerySources() {
  const gallery = await readJson(path.join(contentRoot, "gallery", "gallery.json"), {
    categories: [],
  });

  return (gallery.categories || []).flatMap((category) =>
    (category.images || []).map((image) => ({
      id: `gallery:${category.id}:${image.id}`,
      type: "gallery",
      label: `Galeri: ${category.id}`,
      content: image,
    }))
  );
}

export async function findManagedMediaUsage(targetUrl, options = {}) {
  const sourceGroups = await Promise.all([
    readDynamicPageSources(),
    readSitePageSources(),
    readBlogSources(),
    readMessageSources(),
    readGallerySources(),
  ]);

  return findMediaReferencesInSources(sourceGroups.flat(), targetUrl, options);
}
