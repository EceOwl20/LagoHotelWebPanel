import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { getAzuraBlogVersion } from "./azura-blog-version.mjs";
import { shareAzuraList } from "./azura-list-flight.mjs";

const exact = (v, keys) => v && typeof v === "object" && !Array.isArray(v) &&
  Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const count = n => Number.isSafeInteger(n) && n >= 0;
const text = s => typeof s === "string" && s.length > 0;
export function validSummarySection(section, value, limit = 5) {
  if (value?.status === "error") return exact(value, ["status", "error"]) &&
    exact(value.error, ["code", "message"]) && text(value.error.code) && text(value.error.message);
  if (!exact(value, ["status", "data"]) || value.status !== "ok") return false;
  const d = value.data;
  if (section === "gallery") return exact(d, ["categoryCount", "imageCount"]) && count(d.categoryCount) && count(d.imageCount);
  const keys = ["total", "currentPublishedCount", "changedCount", "draftCount", "notifications"];
  if (section === "blog") keys.push("latestPost");
  if (!exact(d, keys) || ![d.total, d.currentPublishedCount, d.changedCount, d.draftCount].every(count) ||
      d.total !== d.currentPublishedCount + d.changedCount + d.draftCount) return false;
  const n = d.notifications;
  if (!exact(n, ["total", "items"]) || !count(n.total) || !Array.isArray(n.items) ||
      n.total !== d.draftCount + (section === "blog" ? d.changedCount : 0) ||
      n.items.length !== Math.min(limit, n.total)) return false;
  const identity = section === "blog" ? "slug" : "id";
  if (!n.items.every(item => exact(item, [identity, "title", "status", "hasUnpublishedChanges", "updatedAt"]) &&
      text(item[identity]) && (identity !== "id" || /^[a-f0-9-]{36}$/i.test(item.id)) &&
      (identity !== "slug" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) && text(item.title) &&
      ["draft", "published"].includes(item.status) && typeof item.hasUnpublishedChanges === "boolean" &&
      (item.status === "draft" || (section === "blog" && item.hasUnpublishedChanges)) &&
      typeof item.updatedAt === "string" && Number.isFinite(Date.parse(item.updatedAt)))) return false;
  if (new Set(n.items.map(item => item[identity])).size !== n.items.length) return false;
  return section !== "blog" || (d.total === 0 ? d.latestPost === null :
    exact(d.latestPost, ["slug", "title"]) && text(d.latestPost.slug) && text(d.latestPost.title));
}

export async function requestAzuraDashboardSummary(section, { env = process.env, fetchImpl = fetch } = {}) {
  if (!["gallery", "blog", "pages"].includes(section)) throw new AzuraConnectionError("Geçersiz özet bölümü.", 400);
  const connection = getAzuraConnection(env);
  const version = section === "blog" ? getAzuraBlogVersion(env) : 2;
  return shareAzuraList({ connection, resource: section, version, fetchImpl, variant: "summary:5" }, async () => {
    const url = new URL(connection.url);
    url.pathname = "/api/azura/dashboard/summary";
    url.search = new URLSearchParams({ sections: section, limit: "5" }).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetchImpl(url.toString(), { cache: "no-store", redirect: "error", signal: controller.signal,
        headers: { Authorization: `Bearer ${connection.token}`, ...(version === 3 ? { "X-Azura-Blog-Contract-Version": "3" } : {}) } });
      if (response.status === 404) throw new AzuraConnectionError("Azura özet API’si bulunamadı; önce Azura sürümünü güncelleyin.", 404);
      const payload = await response.json();
      if (!response.ok) throw new AzuraConnectionError(response.status === 404
        ? "Azura özet API’si bulunamadı; önce Azura sürümünü güncelleyin."
        : "Azura özeti alınamadı; bağlantı ve blog sürüm ayarlarını kontrol edin.", response.status);
      if (!exact(payload, [section]) || !validSummarySection(section, payload[section])) throw new AzuraConnectionError("Azura özet yanıtı geçersiz.");
      const result = payload[section];
      if (result.status === "error") throw new AzuraConnectionError("Bu bölümün özeti Azura tarafından okunamadı.", 503);
      return result.data;
    } catch (error) {
      if (error instanceof AzuraConnectionError) throw error;
      throw new AzuraConnectionError(error.name === "AbortError" ? "Azura özet yanıt süresi aşıldı." : "Azura özet bağlantısı başarısız.", error.name === "AbortError" ? 504 : 502);
    } finally { clearTimeout(timer); }
  });
}
