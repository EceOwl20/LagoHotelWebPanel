export function createNotificationLoader(fetcher = fetch) {
  let generation = 0;
  let controller;
  function cancel() {
    generation++;
    controller?.abort();
  }
  async function load(isAzura, onSection) {
    cancel();
    const current = generation;
    controller = new AbortController();
    const signal = controller.signal;
    const sources = isAzura
      ? [["pages", "/api/admin/azura/pages/summary"], ["blog", "/api/admin/azura/blog/summary"]]
      : [["pages", "/api/admin/pages/summary"]];
    await Promise.all(sources.map(async ([section, url]) => {
      let result;
      try {
        const response = await fetcher(url, { cache: "no-store", signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Bildirimler alınamadı.");
        const summary = payload.summary;
        if (!Number.isInteger(summary?.draftCount) || summary.draftCount < 0 || !Array.isArray(summary.drafts)) {
          throw new Error("Geçersiz bildirim yanıtı.");
        }
        result = { status: "ok", summary };
      } catch (error) {
        result = { status: "error", error: error.message || "Bildirimler alınamadı." };
      }
      if (current === generation && !signal.aborted) onSection(section, result);
    }));
  }
  return { load, cancel };
}
