import { validAzuraBlogDraft, validAzuraBlogSlug } from "./azura-blog-model.mjs";

export const AZURA_BLOG_ENDPOINT = "/api/admin/azura/blog/posts";
export async function blogRequest(url, options = {}, fetchImpl = fetch) {
  let response, payload;
  try {
    response = await fetchImpl(url, { cache: "no-store", ...options });
    payload = await response.json();
  } catch { throw Object.assign(new Error("Bağlantı sonucu doğrulanamadı. Yeniden denemeden önce sunucudaki kaydı kontrol edin."), { status: 502 }); }
  if (!response.ok) throw Object.assign(new Error(payload.error || "Blog işlemi başarısız."), { status: response.status });
  return payload;
}

export function blogDraftInput(post) {
  const publishedAt = new Date(post.publishedAt);
  if (!Number.isFinite(publishedAt.getTime())) throw new Error("Geçerli bir yayın tarihi girilmelidir.");
  const result = { coverImage: post.coverImage, publishedAt: publishedAt.toISOString(),
    translations: post.translations, contentBlocks: post.contentBlocks };
  if (!validAzuraBlogDraft(result)) throw new Error("Blog alanlarını kontrol edin: en az bir başlık, dört dil ve geçerli blog görselleri gerekli.");
  return result;
}

// Two explicit writes, not an atomic publish-and-save API. Never retry automatically.
export async function saveAzuraBlog({ slug, draft, revision, publicationStatus, onSaved = () => {}, fetchImpl = fetch }) {
  const targetSlug = slug || draft.slug;
  if (!validAzuraBlogSlug(targetSlug)) throw new Error("Slug en fazla 120 karakter; küçük harf, rakam ve aralarda tire içermelidir.");
  const input = blogDraftInput(draft);
  let savedPost;
  try {
    const saved = await blogRequest(`${AZURA_BLOG_ENDPOINT}${slug ? `/${slug}` : ""}`, {
      method: slug ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...(slug ? { "If-Match": `"${revision}"` } : {}) },
      body: JSON.stringify(slug ? { action: "save", draft: input } : { slug: targetSlug, draft: input }),
    }, fetchImpl);
    savedPost = saved.post;
    onSaved(savedPost);
    if (publicationStatus !== undefined) {
      const published = await blogRequest(`${AZURA_BLOG_ENDPOINT}/${savedPost.slug}`, {
        method: "PUT", headers: { "Content-Type": "application/json", "If-Match": `"${savedPost.revision}"` },
        body: JSON.stringify({ action: publicationStatus === "published" ? "publish" : "unpublish" }),
      }, fetchImpl);
      onSaved(published.post);
      return published.post;
    }
    return savedPost;
  } catch (error) {
    if (savedPost) {
      error.savedPost = savedPost;
      error.message = `Taslak kaydedildi; ${publicationStatus === "draft" ? "yayından kaldırma" : "yayınlama"} tamamlanamadı. ${error.message}`;
    }
    throw error;
  }
}

export function blogDateInput(iso) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1);
}
