export const AZURA_PAGES_API = "/api/admin/azura/pages";
export const AZURA_PAGES_PANEL = "/panel/azura/sayfalar";
export function pageDraftInput(page) {
  return Object.fromEntries(["schemaVersion", "template", "slugs", "showContactSection", "hero", "navigation", "seo", "sections"].map(key => [key, page[key]]));
}
export async function pageRequest(url, options = {}, fetchImpl = fetch) {
  let response, payload;
  try { response = await fetchImpl(url, { cache: "no-store", ...options }); payload = await response.json(); }
  catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(new Error("İşlem sonucu doğrulanamadı. Tekrar yazmadan önce sunucudaki kaydı yükleyin."), { status: 502 });
  }
  if (!response.ok) throw Object.assign(new Error(payload?.error || "Sayfa işlemi başarısız."), { status: response.status });
  return payload;
}
export function assertPageResult(result) {
  if (!result?.page?.id || !/^[a-f0-9]{64}$/.test(result.revision || "") || typeof result.mediaOrigin !== "string") {
    throw Object.assign(new Error("Kaydedilen sayfa doğrulanamadı; sunucudaki kaydı kontrol edin."), { status: 502 });
  }
  return result;
}
// Save and publish are deliberately separate writes. Adopt each confirmed revision.
export async function saveAzuraPage({ id, revision, draft, publicationStatus, onSaved = () => {}, fetchImpl = fetch }) {
  let saved;
  try {
    saved = assertPageResult(await pageRequest(`${AZURA_PAGES_API}${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...(id ? { "If-Match": `"${revision}"` } : {}) },
      body: JSON.stringify(id ? { action: "save", draft: pageDraftInput(draft) } : { draft: pageDraftInput(draft) }),
    }, fetchImpl));
    onSaved(saved);
    if (publicationStatus !== undefined) {
      const published = assertPageResult(await pageRequest(`${AZURA_PAGES_API}/${saved.page.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", "If-Match": `"${saved.revision}"` },
        body: JSON.stringify({ action: publicationStatus === "published" ? "publish" : "unpublish" }),
      }, fetchImpl));
      onSaved(published);
      return published.page;
    }
    return saved.page;
  } catch (error) {
    if (saved) { error.saved = saved; error.message = `Taslak kaydedildi; yayın durumu değiştirilemedi. ${error.message}`; }
    throw error;
  }
}

export function pageHistoryVersions(record) {
  return (record?.history || []).map(version => ({ ...version,
    title: version.draft.hero?.translations?.tr?.title || version.draft.slugs?.tr || "Başlıksız sayfa",
    componentCount: version.draft.sections.length,
  }));
}
