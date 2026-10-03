import { blogContractHeaders } from "./azura-blog-client.mjs";

export function loadDashboardSections({ version, signal, onResult, fetchImpl = fetch }) {
  return [
    ["gallery", "/api/admin/azura/gallery"],
    ["posts", "/api/admin/azura/blog/posts"],
    ["pages", "/api/admin/azura/pages"],
  ].map(async ([key, url]) => {
    try {
      const response = await fetchImpl(url, {
        cache: "no-store", signal,
        ...(key === "posts" ? { headers: blogContractHeaders(version) } : {}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Veriler alınamadı.");
      const data = key === "gallery" ? payload.gallery?.categories : payload[key];
      if (!Array.isArray(data)) throw new Error("Sunucu geçerli bir liste döndürmedi.");
      if (!signal.aborted) onResult(key, { data, error: "" });
    } catch (error) {
      if (!signal.aborted) onResult(key, { data: null, error: error.message || "Veriler alınamadı." });
    }
  });
}
