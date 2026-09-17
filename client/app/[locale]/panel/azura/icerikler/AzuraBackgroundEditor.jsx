"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";
import ObjectEditor from "../../components/ObjectEditor";
import PageImagePicker from "../../sayfalar/components/PageImagePicker";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  AZURA_BACKGROUND_TEXT_FIELDS,
  isValidAzuraHomepageSection,
} from "@/lib/admin/azura-homepage-section.mjs";

const API_PATH = "/api/admin/azura/homepage/sections/background";
const IMAGES_PATH = "/api/admin/azura/homepage/images";

export default function AzuraBackgroundEditor({ activeLocale, onDirtyChange }) {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const [section, setSection] = useState(null);
  const [original, setOriginal] = useState(null);
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const [mediaSuccess, setMediaSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSection() {
      try {
        const response = await fetch(API_PATH, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura arka plan bölümü alınamadı.");
        if (!isValidAzuraHomepageSection("background", data.section)) {
          throw new Error("Azura arka plan bölümü beklenen biçimde değil.");
        }
        if (!cancelled) {
          setSection(data.section);
          setOriginal(data.section);
          setRevision(data.revision);
        }
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    async function loadImages() {
      try {
        const response = await fetch(IMAGES_PATH, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura medya kütüphanesi alınamadı.");
        if (!cancelled) setImages(data.images);
      } catch (cause) {
        if (!cancelled) setMediaError(cause.message);
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    }
    loadSection();
    loadImages();
    return () => { cancelled = true; };
  }, []);

  const changed = Boolean(section && original && JSON.stringify(section) !== JSON.stringify(original));
  useEffect(() => { onDirtyChange?.(changed); }, [changed, onDirtyChange]);

  function changeSection(update) {
    setError("");
    setSuccess("");
    setSection((current) => update(current));
  }

  function changeText(updater) {
    changeSection((current) => ({
      ...current,
      translations: { ...current.translations, [activeLocale]: updater(current.translations[activeLocale]) },
    }));
  }

  function changeImage(image) {
    setMediaError("");
    setMediaSuccess("");
    changeSection((current) => ({ ...current, image }));
  }

  async function uploadImage(file) {
    if (!canEdit || uploading || saving) return null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMediaError("Yalnızca JPEG, PNG veya WebP görseli yüklenebilir.");
      return null;
    }
    if (file.size < 1 || file.size > 8 * 1024 * 1024) {
      setMediaError("Görsel boş veya 8 MiB sınırını aşıyor.");
      return null;
    }
    setUploading(true);
    setMediaError("");
    setMediaSuccess("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(IMAGES_PATH, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Azura görseli yüklenemedi.");
      setImages((current) => [data, ...current.filter((item) => item.image !== data.image)]);
      changeImage(data.image);
      setMediaSuccess("Görsel yüklendi ve seçildi. Yayınlamak için bu bölümü kaydedin.");
      return data.image;
    } catch (cause) {
      setMediaError(cause.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!canEdit || !changed || saving || uploading) return;
    if (!isValidAzuraHomepageSection("background", section)) {
      setError("Arka plan görseli ve dört dildeki metinlerin tamamı geçerli olmalıdır.");
      setSuccess("");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, revision }),
      });
      const data = await response.json();
      if (response.status === 409) {
        throw new Error("Bu bölüm başka bir sekmede veya kullanıcı tarafından değiştirildi. Değişikliklerinizi kopyalayıp sayfayı yenileyin; eski veriyle kayıt yapılmadı.");
      }
      if (!response.ok) throw new Error(data.error || "Azura arka plan bölümü kaydedilemedi.");
      const checkResponse = await fetch(API_PATH, { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok || JSON.stringify(checkData.section) !== JSON.stringify(data.section) ||
          checkData.revision !== data.revision) {
        throw new Error("Kaydedilen arka plan bölümü tekrar okumada farklı döndü. Sayfayı yenileyip kontrol edin.");
      }
      setSection(checkData.section);
      setOriginal(checkData.section);
      setRevision(checkData.revision);
      setSuccess("Azura arka plan bölümü kaydedildi. Anasayfada değişikliği kontrol edin.");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Anasayfa bölümü</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">Arka planlı tanıtım</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">Bölümün görselini ve dört dildeki metinlerini düzenleyin. Hakkımızda bağlantısı sabittir.</p>
        </div>
        {section ? <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}</span> : null}
      </div>
      {!canEdit ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p> : null}
      {loading ? <p className="text-sm text-stone-500">Azura arka plan bölümü yükleniyor...</p> : null}
      {mediaLoading ? <p className="text-sm text-stone-500">Azura görselleri yükleniyor...</p> : null}
      {mediaError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{mediaError}</p> : null}
      {mediaSuccess ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{mediaSuccess}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p> : null}
      {section ? <>
        <PageImagePicker
          label="Arka plan görseli"
          value={section.image}
          externalAssets={images}
          externalPreviewUrl={images.find((item) => item.image === section.image)?.previewUrl}
          externalUpload={uploadImage}
          externalLoading={mediaLoading}
          externalError={mediaError}
          disabled={!canEdit || saving || uploading}
          uploadAccept="image/jpeg,image/png,image/webp"
          allowClear={false}
          onChange={changeImage}
        />
        <fieldset disabled={!canEdit || saving || uploading} className="disabled:opacity-70">
          <ObjectEditor value={section.translations[activeLocale]} onChange={changeText} fieldLimits={AZURA_BACKGROUND_TEXT_FIELDS} />
        </fieldset>
        <p className="text-xs text-stone-500">Metinlerde Enter ile satır sonu eklemeyin; Azura API’si bunu kabul etmez.</p>
        <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
          <button type="submit" disabled={!canEdit || !changed || saving || uploading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
            <FiSave className="h-4 w-4" />{saving ? "Kaydediliyor..." : "Arka planlı tanıtımı Azura’ya kaydet"}
          </button>
          {changed ? <p className="text-xs font-medium text-amber-700">Kaydedilmemiş arka plan değişiklikleri var.</p> : null}
        </div>
      </> : null}
    </form>
  );
}
