"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import RoomsPageFields from "../../icerikler/RoomsPageFields";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { isValidAzuraRoomsPage } from "@/lib/admin/azura-rooms-page-content.mjs";
import { AZURA_ROOM_CARDS } from "@/lib/admin/room-cards-model.mjs";

const API = "/api/admin/azura/rooms/page-content";
const IMAGES = "/api/admin/azura/rooms/images";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const AzuraRoomsEditor = forwardRef(function AzuraRoomsEditor({ activeLocale, onDirtyChange }, ref) {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const [draft, setDraft] = useState(null);
  const [original, setOriginal] = useState(null);
  const [revision, setRevision] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [success, setSuccess] = useState("");
  const editVersion = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(API, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura oda sayfası alınamadı.");
        if (!isValidAzuraRoomsPage(data.bundle, data.media)) throw new Error("Azura oda sayfası beklenen biçimde değil.");
        if (!cancelled) {
          const page = { bundle: data.bundle, media: data.media };
          setDraft(page); setOriginal(page); setRevision(data.revision);
        }
      } catch (cause) { if (!cancelled) setError(cause.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    async function loadImages() {
      try {
        const response = await fetch(IMAGES, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura oda görselleri alınamadı.");
        if (!Array.isArray(data.images)) throw new Error("Azura oda görsel listesi geçersiz.");
        if (!cancelled) setImages(data.images);
      } catch (cause) { if (!cancelled) setMediaError(cause.message); }
      finally { if (!cancelled) setMediaLoading(false); }
    }
    load(); loadImages();
    return () => { cancelled = true; };
  }, []);

  const changed = Boolean(draft && original && !same(draft, original));
  useEffect(() => { onDirtyChange?.(changed); }, [changed, onDirtyChange]);

  function updatePart(part, updater) {
    editVersion.current += 1;
    setDraft((current) => ({ ...current, [part]: updater(current[part]) }));
    setError(""); setSuccess("");
  }

  async function uploadImage(file) {
    if (!canEdit || uploading || saving) return null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024) {
      setMediaError("Yalnızca 8 MiB altındaki JPEG, PNG veya WebP görselleri yüklenebilir.");
      return null;
    }
    setUploading(true); setMediaError("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(IMAGES, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Azura oda görseli yüklenemedi.");
      if (typeof data.image !== "string") throw new Error("Azura geçerli görsel yolu döndürmedi.");
      setImages((current) => [data, ...current.filter((image) => image.image !== data.image)]);
      return data.image;
    } catch (cause) { setMediaError(cause.message); return null; }
    finally { setUploading(false); }
  }

  async function save() {
    if (!changed) return "skipped";
    if (!canEdit || saving || uploading) {
      setError("Görsel yüklemesi veya başka bir kayıt sürüyor. İşlem bitince yeniden deneyin.");
      return "failed";
    }
    if (!isValidAzuraRoomsPage(draft.bundle, draft.media)) {
      setError("Tüm metinler, görseller ve dört dildeki alt açıklamaları dolu olmalıdır. Satır sonu kullanmayın.");
      return "failed";
    }
    const version = editVersion.current;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch(API, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, revision }),
      });
      const data = await response.json();
      if (response.status === 409) throw new Error("Oda sayfası başka bir sekmede değiştirildi. Değişikliklerinizi kopyalayıp sayfayı yenileyin.");
      if (!response.ok) throw new Error(data.error || "Azura oda sayfası kaydedilemedi.");
      const checkResponse = await fetch(API, { cache: "no-store" });
      const check = await checkResponse.json();
      if (!checkResponse.ok || !same(check.bundle, data.bundle) || !same(check.media, data.media) || check.revision !== data.revision) {
        throw new Error("Kayıt sonrası tekrar okumada farklı veri döndü. Sayfayı yenileyip kontrol edin.");
      }
      setRevision(check.revision);
      setOriginal({ bundle: check.bundle, media: check.media });
      if (editVersion.current === version) {
        setDraft({ bundle: check.bundle, media: check.media });
        setSuccess("Azura oda sayfası kaydedildi.");
      } else setSuccess("İlk değişiklikler kaydedildi; kayıt sırasında yapılan yenileri hâlâ bekliyor.");
      return "saved";
    } catch (cause) { setError(cause.message); return "failed"; }
    finally { setSaving(false); }
  }

  useImperativeHandle(ref, () => ({ save }));
  return <div className="space-y-5">
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Odalar sayfası</p>
      <h2 className="mt-1 text-xl font-semibold text-stone-900">Azura oda içerikleri</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">Banner, giriş, üç oda kartı ve parallax alanları aynı formda düzenlenir.</p>
      {loading ? <p className="mt-4 text-sm text-stone-500">Azura oda sayfası yükleniyor...</p> : null}
      {mediaLoading ? <p className="mt-4 text-sm text-stone-500">Azura oda görselleri yükleniyor...</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {mediaError ? <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{mediaError}</p> : null}
      {success ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p> : null}
    </div>
    {draft ? <RoomsPageFields bundle={draft.bundle} media={draft.media} activeLocale={activeLocale}
      cardConfig={AZURA_ROOM_CARDS} disabled={!canEdit || saving || uploading}
      onBundleChange={(updater) => updatePart("bundle", updater)}
      onMediaChange={(updater) => updatePart("media", updater)}
      externalAssets={images} externalUpload={uploadImage} externalLoading={mediaLoading} externalError={mediaError} /> : null}
    {changed ? <p className="text-xs font-medium text-amber-700">Kaydedilmemiş oda sayfası değişiklikleri var.</p> : null}
  </div>;
});

export default AzuraRoomsEditor;
