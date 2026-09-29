"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AZURA_PAGES_API, assertPageResult, pageRequest, saveAzuraPage } from "@/lib/admin/azura-pages-client.mjs";

export default function useAzuraPage({ enabled, pageId, acceptSavedDraft }) {
  const current = useRef(null);
  const busyRef = useRef(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [images, setImages] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [revision, setRevision] = useState("");
  const adopt = useCallback(result => {
    assertPageResult(result);
    current.current = result;
    setRevision(result.revision);
    setOrigin(result.mediaOrigin);
    acceptSavedDraft(result.page);
    setBlocked(false);
  }, [acceptSavedDraft]);

  const loadImages = useCallback(async (signal) => {
    if (!enabled) return;
    setMediaLoading(true); setMediaError("");
    try {
      const payload = await pageRequest(`${AZURA_PAGES_API}/images`, { signal });
      if (!Array.isArray(payload.images)) throw new Error("Görsel listesi geçersiz.");
      if (!signal?.aborted) setImages(payload.images);
    } catch (error) { if (error.name !== "AbortError") setMediaError(error.message); }
    finally { if (!signal?.aborted) setMediaLoading(false); }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    loadImages(controller.signal);
    // A new page also needs the trusted image origin, even with an empty library.
    if (!pageId) pageRequest(AZURA_PAGES_API, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setOrigin(result.mediaOrigin); })
      .catch(error => { if (error.name !== "AbortError") setMediaError(error.message); });
    return () => controller.abort();
  }, [enabled, pageId, loadImages]);

  const save = async (draft, publicationStatus) => {
    if (busyRef.current || blocked) throw new Error("Önce devam eden işlemi tamamlayın veya sunucudaki kaydı yükleyin.");
    const id = current.current?.page.id || pageId;
    if (id && !current.current?.revision) throw new Error("Sayfanın güncel sürümü yüklenmedi.");
    busyRef.current = true; setBusy(true);
    try {
      return await saveAzuraPage({ id, revision: current.current?.revision, draft, publicationStatus, onSaved: adopt });
    } catch (error) {
      if (error.status === 409 || error.status >= 500 || error.status === 404 || error.status === 428) setBlocked(true);
      throw error;
    } finally { busyRef.current = false; setBusy(false); }
  };
  const reload = async () => {
    if (busyRef.current) return;
    const id = current.current?.page.id || pageId;
    if (!id) throw new Error("Oluşturma sonucu doğrulanamadı. Sayfalar listesine dönüp kaydın oluşup oluşmadığını kontrol edin.");
    if (!window.confirm("Formdaki kaydedilmemiş değişiklikler bırakılıp sunucudaki kayıt yüklensin mi?")) return;
    busyRef.current = true; setBusy(true);
    try { adopt(await pageRequest(`${AZURA_PAGES_API}/${id}`)); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const restore = async versionId => {
    if (busyRef.current || blocked || !current.current?.revision) throw new Error("Önce sunucudaki güncel kaydı yükleyin.");
    if (!window.confirm("Seçilen sürüm taslağa getirilecek. Formdaki kaydedilmemiş değişiklikler bırakılacak; canlı yayın değişmeyecek. Devam edilsin mi?")) return false;
    busyRef.current = true; setBusy(true);
    try {
      adopt(await pageRequest(`${AZURA_PAGES_API}/${current.current.page.id}/history/${versionId}/restore`, {
        method: "POST", headers: { "If-Match": `"${current.current.revision}"` },
      }));
      return true;
    } catch (error) { if (error.status === 409 || error.status >= 500) setBlocked(true); throw error; }
    finally { busyRef.current = false; setBusy(false); }
  };
  const upload = async file => {
    if (busyRef.current || blocked) throw new Error("Devam eden işlem tamamlanmadan yükleme yapılamaz.");
    busyRef.current = true; setBusy(true);
    try {
      const body = new FormData(); body.append("file", file);
      const result = await pageRequest(`${AZURA_PAGES_API}/images`, { method: "POST", body });
      if (!result.image?.startsWith("/uploads/dynamic-pages/")) throw new Error("Yükleme yanıtı geçersiz.");
      setImages(previous => [result, ...previous.filter(image => image.image !== result.image)]);
      if (result.previewUrl) setOrigin(new URL(result.previewUrl).origin);
      return result.image;
    } finally { busyRef.current = false; setBusy(false); }
  };
  return { adopt, save, reload, restore, blocked, busy, revision, origin, loadImages,
    media: { images, origin, loading: mediaLoading, error: mediaError, upload, disabled: busy || blocked } };
}
