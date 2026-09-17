"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FiCheck } from "react-icons/fi";
import ObjectEditor from "../../components/ObjectEditor";
import PageImagePicker from "../../sayfalar/components/PageImagePicker";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  AZURA_ACCOMMODATION_CARD_FIELDS,
  AZURA_ACCOMMODATION_TEXT_FIELDS,
  isValidAzuraHomepageSection,
} from "@/lib/admin/azura-homepage-section.mjs";

const API_PATH = "/api/admin/azura/homepage/sections/accommodation";
const IMAGES_PATH = "/api/admin/azura/homepage/images";
const CARD_LABELS = {
  deluxe: ["Deluxe oda", "/rooms/deluxeroom"],
  fantasy: ["Fantasy oda", "/rooms/fantasyroom"],
  family: ["Aile odası", "/rooms/familyroom"],
};

const AzuraAccommodationEditor = forwardRef(function AzuraAccommodationEditor({ activeLocale, onDirtyChange }, ref) {
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
        if (!response.ok) throw new Error(data.error || "Azura oda kartları alınamadı.");
        if (!isValidAzuraHomepageSection("accommodation", data.section)) {
          throw new Error("Azura oda kartları beklenen biçimde değil.");
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

  function changeCard(key, updater) {
    changeSection((current) => ({
      ...current,
      cards: current.cards.map((card) => card.key === key ? updater(card) : card),
    }));
  }

  function changeImage(key, image) {
    setMediaError("");
    setMediaSuccess("");
    changeCard(key, (card) => ({ ...card, image }));
  }

  function changeCardText(key, updater) {
    changeCard(key, (card) => ({
      ...card,
      translations: { ...card.translations, [activeLocale]: updater(card.translations[activeLocale]) },
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
      if (!response.ok) throw new Error(data.error || "Azura görseli yüklenemedi.");
      setImages((current) => [data, ...current.filter((item) => item.image !== data.image)]);
      changeImage(key, data.image);
      setMediaSuccess("Görsel yüklendi ve seçildi. Yayınlamak için oda kartlarını kaydedin.");
      return data.image;
    } catch (cause) {
      setMediaError(cause.message);
      return null;
    } finally {
      setUploadingKey("");
    }
  }

  async function save(event) {
    event?.preventDefault();
    if (!changed) return "skipped";
    if (!canEdit || saving || uploadingKey) {
      setError("Görsel yüklemesi veya başka bir kayıt sürüyor. İşlem bitince yeniden deneyin.");
      return "failed";
    }
    if (!isValidAzuraHomepageSection("accommodation", section)) {
      setError("Üç oda kartının görseli ve dört dildeki tüm metinleri geçerli olmalıdır.");
      setSuccess("");
      return "failed";
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
        throw new Error("Oda kartları başka bir sekmede veya kullanıcı tarafından değiştirildi. Değişikliklerinizi kopyalayıp sayfayı yenileyin; eski veriyle kayıt yapılmadı.");
      }
      if (!response.ok) throw new Error(data.error || "Azura oda kartları kaydedilemedi.");
      const checkResponse = await fetch(API_PATH, { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok || JSON.stringify(checkData.section) !== JSON.stringify(data.section) ||
          checkData.revision !== data.revision) {
        throw new Error("Kaydedilen oda kartları tekrar okumada farklı döndü. Sayfayı yenileyip kontrol edin.");
      }
      setSection(checkData.section);
      setOriginal(checkData.section);
      setRevision(checkData.revision);
      setSuccess("Azura oda kartları kaydedildi. Anasayfada değişikliği kontrol edin.");
      return "saved";
    } catch (cause) {
      setError(cause.message);
      return "failed";
    } finally {
      setSaving(false);
    }
  }

  useImperativeHandle(ref, () => ({ save }));

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Anasayfa bölümü</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">Oda kartları</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">Üç kartın metinlerini ve görsellerini düzenleyin. Kart sırası, bağlantılar ve ikonlar sabittir.</p>
        </div>
        {section ? <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}</span> : null}
      </div>
      {!canEdit ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p> : null}
      {loading ? <p className="text-sm text-stone-500">Azura oda kartları yükleniyor...</p> : null}
      {mediaLoading ? <p className="text-sm text-stone-500">Azura görselleri yükleniyor...</p> : null}
      {mediaError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{mediaError}</p> : null}
      {mediaSuccess ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{mediaSuccess}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p> : null}
      {section ? <>
        <fieldset disabled={!canEdit || saving || Boolean(uploadingKey)} className="disabled:opacity-70">
          <ObjectEditor value={section.translations[activeLocale]} onChange={changeText} fieldLimits={AZURA_ACCOMMODATION_TEXT_FIELDS} />
        </fieldset>
        <div className="grid gap-5 xl:grid-cols-2">
          {section.cards.map((card, index) => {
            const [label, link] = CARD_LABELS[card.key];
            return <fieldset key={card.key} className="min-w-0 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
              <legend className="px-1 text-sm font-semibold text-stone-900">{index + 1}. {label}</legend>
              <p className="text-xs text-stone-500">Sabit bağlantı: {link}</p>
              <PageImagePicker
                label={`${label} görseli`}
                value={card.image}
                externalAssets={images}
                externalPreviewUrl={images.find((item) => item.image === card.image)?.previewUrl}
                externalUpload={(file) => uploadImage(card.key, file)}
                externalLoading={mediaLoading}
                externalError={mediaError}
                disabled={!canEdit || saving || Boolean(uploadingKey)}
                uploadAccept="image/jpeg,image/png,image/webp"
                allowClear={false}
                onChange={(image) => changeImage(card.key, image)}
              />
              <fieldset disabled={!canEdit || saving || Boolean(uploadingKey)} className="disabled:opacity-70">
                <ObjectEditor
                  value={card.translations[activeLocale]}
                  onChange={(updater) => changeCardText(card.key, updater)}
                  fieldLimits={AZURA_ACCOMMODATION_CARD_FIELDS}
                />
              </fieldset>
            </fieldset>;
          })}
        </div>
        {changed ? <p className="text-xs font-medium text-amber-700">Kaydedilmemiş oda kartı değişiklikleri var.</p> : null}
      </> : null}
    </form>
  );
});

export default AzuraAccommodationEditor;
