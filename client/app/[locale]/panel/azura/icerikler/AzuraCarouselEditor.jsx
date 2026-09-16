"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  AZURA_CAROUSEL_KEYS,
  isValidAzuraHomepageSection,
} from "@/lib/admin/azura-homepage-section.mjs";
import AzuraImagePicker from "../experience/AzuraImagePicker";

const API_PATH = "/api/admin/azura/homepage/sections/carousel";
const IMAGES_PATH = "/api/admin/azura/homepage/images";
const slideLabels = {
  accommodation: ["Konaklama", "/rooms"],
  restaurants: ["Restoranlar", "/restaurants"],
  beachPools: ["Plaj ve havuzlar", "/beachpools"],
  experiences: ["Deneyimler", "/entertainment"],
  kids: ["Çocuklar", "/kidsclub"],
};
const localeLabels = { tr: "Türkçe", en: "İngilizce", de: "Almanca", ru: "Rusça" };

export default function AzuraCarouselEditor({ activeLocale, onDirtyChange }) {
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
  const [uploadingKey, setUploadingKey] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadSection() {
      try {
        const response = await fetch(API_PATH, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura kaydırıcı verisi alınamadı.");
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
        if (!response.ok) throw new Error(data.error || "Azura görsel listesi alınamadı.");
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

  const changed = section && original && JSON.stringify(section) !== JSON.stringify(original);
  useEffect(() => {
    onDirtyChange?.(Boolean(changed));
  }, [changed, onDirtyChange]);

  function changeSlide(key, update) {
    setError("");
    setSuccess("");
    setSection((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.key === key ? update(slide) : slide),
    }));
  }

  function changeImage(key, image) {
    setMediaError("");
    setMediaSuccess("");
    changeSlide(key, (slide) => ({ ...slide, image }));
  }

  function changeTranslation(key, field, value) {
    changeSlide(key, (slide) => ({
      ...slide,
      translations: {
        ...slide.translations,
        [activeLocale]: { ...slide.translations[activeLocale], [field]: value },
      },
    }));
  }

  async function uploadImage(key, file) {
    if (!canEdit || uploadingKey || saving) return null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMediaError("Yalnızca JPEG, PNG veya WebP görseli yüklenebilir.");
      return null;
    }
    if (file.size < 1 || file.size > 8 * 1024 * 1024) {
      setMediaError("Görsel boş veya 8 MiB sınırını aşıyor.");
      return null;
    }
    setUploadingKey(key);
    setMediaError("");
    setMediaSuccess("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(IMAGES_PATH, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Azura görsel yüklemesi başarısız oldu.");
      setImages((current) => [data, ...current.filter((item) => item.image !== data.image)]);
      changeImage(key, data.image);
      setMediaSuccess("Görsel Azura’ya yüklendi ve seçildi. Kaydırıcıda yayınlamak için aşağıdaki kaydet düğmesine basın.");
      return data.image;
    } catch (cause) {
      setMediaError(cause.message);
      return null;
    } finally {
      setUploadingKey("");
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!canEdit || !changed || saving || uploadingKey) return;
    if (!isValidAzuraHomepageSection("carousel", section)) {
      setError("Beş kartın görsel yolu ve dört dilde başlık ile alt açıklaması dolu ve geçerli olmalıdır.");
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
        throw new Error("Kaydırıcı başka bir sekmede veya kullanıcı tarafından değiştirildi. Değişikliklerinizi kopyalayıp sayfayı yenileyin; eski veriyle kayıt yapılmadı.");
      }
      if (!response.ok) throw new Error(data.error || "Azura kaydırıcısı kaydedilemedi.");
      const checkResponse = await fetch(API_PATH, { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok) throw new Error(checkData.error || "Azura kaydırıcı kaydı doğrulanamadı.");
      if (JSON.stringify(checkData.section) !== JSON.stringify(data.section) ||
          checkData.revision !== data.revision) {
        throw new Error("Azura kaydedilen kaydırıcıyı tekrar okumada farklı döndürdü. Sayfayı yenileyip kontrol edin.");
      }
      setSection(checkData.section);
      setOriginal(checkData.section);
      setRevision(checkData.revision);
      setSuccess("Azura keşif kaydırıcısı kaydedildi. Anasayfada değişikliği kontrol edin.");
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
          <h2 className="mt-1 text-xl font-semibold text-stone-900">Keşif kaydırıcısı</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">Beş kartın görselini, başlığını ve alt açıklamasını düzenleyin. Sıra ve bağlantılar sabittir.</p>
        </div>
        {section && <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}
        </span>}
      </div>
      {!canEdit && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p>}
      {loading && <p className="text-sm text-stone-500">Azura kaydırıcısı yükleniyor...</p>}
      {mediaLoading && <p className="text-sm text-stone-500">Azura medya kütüphanesi yükleniyor...</p>}
      {mediaError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{mediaError}</p>}
      {mediaSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{mediaSuccess}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
      {section && (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            {section.slides.map((slide) => {
              const [label, link] = slideLabels[slide.key] || [slide.key, ""];
              return (
                <fieldset key={slide.key} className="min-w-0 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold text-stone-900">{AZURA_CAROUSEL_KEYS.indexOf(slide.key) + 1}. {label}</legend>
                  <p className="text-xs text-stone-500">Sabit bağlantı: {link}</p>
                  <AzuraImagePicker
                    label={`${label} görseli`}
                    value={slide.image}
                    images={images}
                    loading={mediaLoading}
                    error={mediaError}
                    disabled={!canEdit || saving || Boolean(uploadingKey)}
                    uploading={uploadingKey === slide.key}
                    onChange={(image) => changeImage(slide.key, image)}
                    onUpload={(file) => uploadImage(slide.key, file)}
                  />
                  <label className="block space-y-2 text-sm font-medium text-stone-700">
                    <span>{localeLabels[activeLocale]} kart başlığı</span>
                    <input
                      value={slide.translations[activeLocale].title}
                      onChange={(event) => changeTranslation(slide.key, "title", event.target.value)}
                      disabled={!canEdit || saving || Boolean(uploadingKey)}
                      maxLength={200}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#63978f] disabled:bg-stone-100"
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium text-stone-700">
                    <span>{localeLabels[activeLocale]} görsel alt açıklaması</span>
                    <input
                      value={slide.translations[activeLocale].alt}
                      onChange={(event) => changeTranslation(slide.key, "alt", event.target.value)}
                      disabled={!canEdit || saving || Boolean(uploadingKey)}
                      maxLength={300}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#63978f] disabled:bg-stone-100"
                    />
                  </label>
                </fieldset>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
            <button type="submit" disabled={!canEdit || !changed || saving || Boolean(uploadingKey)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{saving ? "Kaydediliyor..." : "Beş kartı Azura’ya kaydet"}
            </button>
            {changed && <p className="text-xs font-medium text-amber-700">Kaydedilmemiş kaydırıcı değişiklikleri var.</p>}
          </div>
        </>
      )}
    </form>
  );
}
