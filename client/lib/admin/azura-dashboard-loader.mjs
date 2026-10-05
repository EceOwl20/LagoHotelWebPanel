import { blogContractHeaders } from "./azura-blog-client.mjs";

export function loadDashboardSections({ version, signal, onResult, fetchImpl = fetch }) {
  return [
    ["gallery", "/api/admin/azura/dashboard/summary?section=gallery"],
    ["posts", "/api/admin/azura/dashboard/summary?section=blog"],
    ["pages", "/api/admin/azura/dashboard/summary?section=pages"],
  ].map(async ([key, url]) => {
    try {
      const response = await fetchImpl(url, {
        cache: "no-store", signal,
        ...(key === "posts" ? { headers: blogContractHeaders(version) } : {}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Veriler alınamadı.");
      const data = payload.summary;
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Sunucu geçerli bir özet döndürmedi.");
      if (!signal.aborted) onResult(key, { data, error: "" });
    } catch (error) {
      if (!signal.aborted) onResult(key, { data: null, error: error.message || "Veriler alınamadı." });
    }
  });
}
