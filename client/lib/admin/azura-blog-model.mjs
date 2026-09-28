// Mirrors Azura's v2 contract; intentionally independent of Lago's disk storage.
export const BLOG_LOCALES = ["tr", "en", "de", "ru"];
const keys = (v, names) => Boolean(v && typeof v === "object" && !Array.isArray(v) &&
  Object.keys(v).length === names.length && names.every((n) => Object.hasOwn(v, n)));
export const validAzuraBlogSlug = (v) => typeof v === "string" && v.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
export const validAzuraBlogImage = (v) => typeof v === "string" && (v === "" ||
  (/^\/uploads\/blog\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.(jpg|jpeg|png|webp)$/i.test(v) && !v.includes("..")));
const text = (v, max) => typeof v === "string" && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const date = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;

export function validAzuraBlogDraft(v) {
  if (!keys(v, ["coverImage", "publishedAt", "translations", "contentBlocks"]) ||
      !validAzuraBlogImage(v.coverImage) || !date(v.publishedAt) || !keys(v.translations, BLOG_LOCALES) ||
      !Array.isArray(v.contentBlocks)) return false;
  if (!BLOG_LOCALES.every((l) => {
    const t = v.translations[l];
    return keys(t, ["title", "excerpt", "content", "seoTitle", "seoDescription"]) &&
      text(t.title, 500) && text(t.seoTitle, 500) && text(t.excerpt, 4000) &&
      text(t.seoDescription, 4000) && text(t.content, 100000);
  }) || !BLOG_LOCALES.some((l) => v.translations[l].title.trim())) return false;
  const ids = new Set();
  return v.contentBlocks.every((b) => {
    if (!keys(b, ["id", "headingLevel", "image", "translations"]) || typeof b.id !== "string" ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(b.id) || ids.has(b.id) ||
        !["h2", "h3"].includes(b.headingLevel) || !validAzuraBlogImage(b.image) ||
        !keys(b.translations, BLOG_LOCALES)) return false;
    ids.add(b.id);
    return BLOG_LOCALES.every((l) => keys(b.translations[l], ["heading", "content"]) &&
      text(b.translations[l].heading, 500) && text(b.translations[l].content, 100000));
  });
}

function validSnapshot(v, slug, status) {
  if (!keys(v, ["slug", "status", "updatedAt", "coverImage", "publishedAt", "translations", "contentBlocks"]) ||
      v.slug !== slug || v.status !== status || !date(v.updatedAt)) return false;
  const { slug: _slug, status: _status, updatedAt: _updatedAt, ...draft } = v;
  return validAzuraBlogDraft(draft);
}

export function validAzuraBlogRecord(r) {
  return keys(r, ["storageVersion", "slug", "createdAt", "updatedAt", "publicationUpdatedAt", "draft", "published"]) &&
    r.storageVersion === 2 && validAzuraBlogSlug(r.slug) && date(r.createdAt) && date(r.updatedAt) &&
    validSnapshot(r.draft, r.slug, "draft") && (r.published === null ? r.publicationUpdatedAt === null :
      date(r.publicationUpdatedAt) && validSnapshot(r.published, r.slug, "published"));
}

export function validAzuraBlogBody(method, body) {
  if (method === "POST") return keys(body, ["slug", "draft"]) && validAzuraBlogSlug(body.slug) && validAzuraBlogDraft(body.draft);
  if (method === "PUT") return body?.action === "save" ? keys(body, ["action", "draft"]) && validAzuraBlogDraft(body.draft) :
    keys(body, ["action"]) && ["publish", "unpublish"].includes(body.action);
  return body === undefined;
}
