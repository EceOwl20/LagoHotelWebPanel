import { getAzuraBlogVersion } from "./azura-blog-version.mjs";
import { shareAzuraList } from "./azura-list-flight.mjs";
import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { isValidAzuraRevision } from "./azura-revision.mjs";
import { validAzuraBlogBody, validAzuraBlogRecord, validAzuraBlogSlug } from "./azura-blog-model.mjs";
import { createAdminBlogView } from "./blog-versions.mjs";

function toView(payload, origin, slug, version) {
  if (!payload || Object.keys(payload).length !== 2 || !validAzuraBlogRecord(payload.record, version) ||
      !isValidAzuraRevision(payload.revision) || (slug && payload.record.slug !== slug)) {
    throw new AzuraConnectionError("Azura blog yanıtı beklenen biçimde değil.");
  }
  return { ...createAdminBlogView(payload.record), revision: payload.revision, mediaOrigin: origin, ...(version === 3 ? { publishedSlugs: payload.record.published?.slugs || null } : {}) };
}

export async function requestAzuraBlog(method, body, options = {}) {
  const { slug, env = process.env, fetchImpl = fetch } = options;
  const version = getAzuraBlogVersion(env);
  if ((slug !== undefined && !validAzuraBlogSlug(slug)) ||
      !(slug ? ["GET", "PUT", "DELETE"] : ["GET", "POST"]).includes(method) || !validAzuraBlogBody(method, body, version)) {
    throw new AzuraConnectionError("Blog isteği geçersiz.", 400);
  }
  if (["PUT", "DELETE"].includes(method) && !isValidAzuraRevision(options.revision)) {
    throw new AzuraConnectionError("Blog sürümü geçersiz.", 400);
  }
  if (method === "GET" && slug) return requestAzuraBlogDirect(method, body, options);
  return shareAzuraList({ connection: getAzuraConnection(env), resource: "blog",
    version: getAzuraBlogVersion(env), fetchImpl, write: method !== "GET" },
  () => requestAzuraBlogDirect(method, body, options));
}

async function requestAzuraBlogDirect(method, body, { slug, revision, env = process.env, fetchImpl = fetch } = {}) {
  const version = getAzuraBlogVersion(env);
  if ((slug !== undefined && !validAzuraBlogSlug(slug)) ||
      !(slug ? ["GET", "PUT", "DELETE"] : ["GET", "POST"]).includes(method) || !validAzuraBlogBody(method, body, version)) {
    throw new AzuraConnectionError("Blog isteği geçersiz.", 400);
  }
  if (["PUT", "DELETE"].includes(method) && !isValidAzuraRevision(revision)) throw new AzuraConnectionError("Blog sürümü geçersiz.", 400);
  const connection = getAzuraConnection(env);
  const url = new URL(connection.url);
  url.pathname = `/api/azura/blog/posts${slug ? `/${slug}` : ""}`;
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  if (serialized && Buffer.byteLength(serialized) > 128 * 1024) throw new AzuraConnectionError("Blog isteği 128 KiB sınırını aşıyor.", 413);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetchImpl(url.toString(), {
      method, cache: "no-store", signal: controller.signal,
      headers: { ...(version === 3 ? { "X-Azura-Blog-Contract-Version": "3" } : {}), Authorization: `Bearer ${connection.token}`,
        ...(serialized ? { "Content-Type": "application/json" } : {}),
        ...(["PUT", "DELETE"].includes(method) ? { "If-Match": `"${revision}"` } : {}) },
      ...(serialized ? { body: serialized } : {}),
    });
    let payload;
    try { payload = await response.json(); } catch { throw new AzuraConnectionError("Azura blog yanıtı geçersiz."); }
    if (!response.ok) {
      const code = ["BLOG_MIGRATION_REQUIRED", "BLOG_CONTRACT_VERSION_MISMATCH", "BLOG_CONTRACT_CONFIGURATION_ERROR"].includes(payload?.code) ? payload.code : undefined;
      const messages = {
        BLOG_MIGRATION_REQUIRED: "Azura blog kayıtlarının V3 geçişi tamamlanmamış. Kaydetmeden önce bakım geçişini tamamlayın.",
        BLOG_CONTRACT_VERSION_MISMATCH: "Lago ve Azura blog sürümleri uyuşmuyor. Sunucu ayarlarını kontrol edip sayfayı yenileyin.",
      };
      throw Object.assign(new AzuraConnectionError(messages[code] ||
        (typeof payload?.error === "string" && payload.error.length < 300 ? payload.error : "Azura blog işlemi başarısız."), response.status), code ? { code } : {});
    }
    if (method === "DELETE") {
      if (payload?.deleted !== true || payload.slug !== slug || Object.keys(payload).length !== 2) throw new AzuraConnectionError("Azura silme yanıtı geçersiz.");
      return payload;
    }
    if (method === "GET" && !slug) {
      if (!payload || Object.keys(payload).length !== 1 || !Array.isArray(payload.posts)) throw new AzuraConnectionError("Azura blog listesi geçersiz.");
      const posts = payload.posts.map((item) => toView(item, url.origin, undefined, version));
      if (new Set(posts.map((p) => p.slug)).size !== posts.length) throw new AzuraConnectionError("Azura blog listesinde yinelenen adres var.");
      return { posts, mediaOrigin: url.origin };
    }
    return { post: toView(payload, url.origin, slug || body?.slug, version) };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    throw new AzuraConnectionError(error.name === "AbortError" ? "Azura blog yanıt süresi aşıldı." : "Azura blog bağlantısı kurulamadı.", error.name === "AbortError" ? 504 : 502);
  } finally { clearTimeout(timeout); }
}
