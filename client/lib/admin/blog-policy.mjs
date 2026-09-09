import { getBlogContentBlocksValidationError } from "./blog-blocks.mjs";

const BLOG_STATUSES = new Set(["draft", "published"]);

export function getBlogPostValidationError(post) {
  if (!post || typeof post !== "object") {
    return "Blog yazısı verisi zorunludur.";
  }

  if (!BLOG_STATUSES.has(post.status)) {
    return "Geçersiz blog yayın durumu.";
  }

  const hasTitle = Object.values(post.translations || {}).some((translation) =>
    String(translation?.title || "").trim()
  );

  if (!hasTitle) {
    return "En az bir dilde blog başlığı girilmelidir.";
  }

  if (!post.publishedAt || Number.isNaN(Date.parse(post.publishedAt))) {
    return "Geçerli bir yayın tarihi girilmelidir.";
  }

  const blocksValidationError = getBlogContentBlocksValidationError(
    post.contentBlocks
  );

  if (blocksValidationError) return blocksValidationError;

  return "";
}
