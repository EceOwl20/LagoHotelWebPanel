"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { isValidExperience } from "@/lib/admin/azura-experience.mjs";
import PageImagePicker from "../../sayfalar/components/PageImagePicker";
import ObjectEditor from "../../components/ObjectEditor";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const images = [
  ["background", "Arka görsel"],
  ["foreground", "Ön görsel"],
];
const textFields = [
  ["subtitle", "Üst başlık", 200, false],
  ["title", "Ana başlık", 250, false],
  ["text1", "Birinci paragraf", 2000, true],
  ["text2", "İkinci paragraf", 2000, true],
  ["buttonText", "Galeri düğmesi", 120, false],
];
const textFieldLimits = Object.fromEntries(textFields.map(([field, , maxLength]) => [field, maxLength]));
function validateTextDraft(value) {
  for (const [locale, localeLabel] of locales) {
    if (!value?.[locale]) return `${localeLabel} metinleri eksik.`;
    for (const [field, label, maxLength] of textFields) {
      const text = value[locale][field];
      if (typeof text !== "string" || !text.trim()) return `${localeLabel} · ${label} boş olamaz.`;
      if (text.length > maxLength) return `${localeLabel} · ${label} çok uzun.`;
      if (/[\u0000-\u001f\u007f]/.test(text)) {
        return `${localeLabel} · ${label} satır sonu veya kontrol karakteri içeremez.`;
      }
    }
  }
  return "";
}

const AzuraExperiencePage = forwardRef(function AzuraExperiencePage({ embedded = false, activeLocale: selectedLocale, onDirtyChange }, ref) {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const [experience, setExperience] = useState(null);
  const [original, setOriginal] = useState(null);
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [experienceText, setExperienceText] = useState(null);
  const [originalText, setOriginalText] = useState(null);
  const [textRevision, setTextRevision] = useState(null);
  const [textLoading, setTextLoading] = useState(true);
  const [textSaving, setTextSaving] = useState(false);
  const [textError, setTextError] = useState("");
  const [textSuccess, setTextSuccess] = useState("");
  const [availableImages, setAvailableImages] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const [mediaSuccess, setMediaSuccess] = useState("");
  const [uploadingKey, setUploadingKey] = useState("");
  const [localLocale, setLocalLocale] = useState("tr");
  const activeLocale = selectedLocale || localLocale;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/azura/experience", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura verisi alınamadı.");
        if (!cancelled) {
          setExperience(data.experience);
          setOriginal(data.experience);
          setRevision(data.revision ?? null);
        }
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    async function loadText() {
      try {
        const response = await fetch("/api/admin/azura/experience/text", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura metinleri alınamadı.");
        if (!cancelled) {
          setExperienceText(data.experienceText);
          setOriginalText(data.experienceText);
          setTextRevision(data.revision ?? null);
        }
      } catch (cause) {
        if (!cancelled) setTextError(cause.message);
      } finally {
        if (!cancelled) setTextLoading(false);
      }
    }
    async function loadImages() {
      try {
        const response = await fetch("/api/admin/azura/experience/images", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura görsel listesi alınamadı.");
        if (!cancelled) setAvailableImages(data.images);
      } catch (cause) {
        if (!cancelled) setMediaError(cause.message);
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    }
    load();
    loadText();
    loadImages();
    return () => { cancelled = true; };
  }, []);

  const changed = experience && original &&
    JSON.stringify(experience) !== JSON.stringify(original);
  const textChanged = experienceText && originalText &&
    JSON.stringify(experienceText) !== JSON.stringify(originalText);
  useEffect(() => {
    onDirtyChange?.(Boolean(changed || textChanged));
  }, [changed, textChanged, onDirtyChange]);
  const localeChanged = Object.fromEntries(locales.map(([locale]) => [locale,
    Boolean((experienceText && originalText &&
      JSON.stringify(experienceText[locale]) !== JSON.stringify(originalText[locale])) ||
      (experience && original && images.some(([key]) =>
        experience[key].translations[locale].alt !== original[key].translations[locale].alt)))
  ]));

  function changeImage(key, value) {
    setSuccess("");
    setMediaSuccess("");
    setMediaError("");
    setExperience((current) => ({
      ...current,
      [key]: { ...current[key], image: value },
    }));
  }

  async function uploadImage(key, file) {
    if (!canEdit || uploadingKey || saving || textSaving) return null;
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
      const response = await fetch("/api/admin/azura/experience/images", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Azura görsel yüklemesi başarısız oldu.");
      setAvailableImages((current) => [data, ...current.filter((item) => item.image !== data.image)]);
      changeImage(key, data.image);
      setMediaSuccess("Görsel Azura’ya yüklendi ve seçildi. Anasayfada kullanmak için kaydedin.");
      return data.image;
    } catch (cause) {
      setMediaError(cause.message);
      return null;
    } finally {
      setUploadingKey("");
    }
  }

  function changeAlt(key, locale, value) {
    setSuccess("");
    setExperience((current) => ({
      ...current,
      [key]: {
        ...current[key],
        translations: {
          ...current[key].translations,
          [locale]: { alt: value },
        },
      },
    }));
  }

  function changeText(updater) {
    setTextSuccess("");
    setTextError("");
    setExperienceText((current) => ({
      ...current,
      [activeLocale]: updater(current[activeLocale]),
    }));
  }

  async function save(event) {
    event?.preventDefault();
    if (!changed) return "skipped";
    if (!canEdit || saving || textSaving || uploadingKey) {
      setError("Görsel yüklemesi veya başka bir kayıt sürüyor. İşlem bitince yeniden deneyin.");
      return "failed";
    }
    if (!isValidExperience(experience)) {
      setError("Görsel yolu veya dört dilden birinin alt açıklaması geçersiz. Görsel yolu Azura uploads dizininde olmalı; alt açıklamalar boş olmamalıdır.");
      setSuccess("");
      return "failed";
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/azura/experience", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, revision }),
      });
      const data = await response.json();
      if (response.status === 409) throw new Error("Azura görselleri siz ekranı açtıktan sonra değişti. Kendi değişikliklerinizi kopyalayıp paneli yenileyin; eski veriyle kayıt yapılmadı.");
      if (!response.ok) throw new Error(data.error || "Azura kaydı başarısız oldu.");
      setExperience(data.experience);
      setOriginal(data.experience);
      setRevision(data.revision ?? null);
      setSuccess("Azura tanıtım alanı kaydedildi. Azura anasayfasında değişikliği kontrol edin.");
      return "saved";
    } catch (cause) {
      setError(cause.message);
      return "failed";
    } finally {
      setSaving(false);
    }
  }

  async function saveText(event, fromHomepageSave = false) {
    event?.preventDefault();
    if (!textChanged) return "skipped";
    if (!canEdit || textSaving || (saving && !fromHomepageSave)) {
      setTextError("Başka bir kayıt sürüyor. İşlem bitince yeniden deneyin.");
      return "failed";
    }
    const validationError = validateTextDraft(experienceText);
    if (validationError) {
      setTextSuccess("");
      setTextError(validationError);
      return "failed";
    }
    setTextSaving(true);
    setTextError("");
    setTextSuccess("");
    try {
      const response = await fetch("/api/admin/azura/experience/text", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceText, revision: textRevision }),
      });
      const data = await response.json();
      if (response.status === 409) throw new Error("Azura metinleri siz ekranı açtıktan sonra değişti. Kendi değişikliklerinizi kopyalayıp paneli yenileyin; eski veriyle kayıt yapılmadı.");
      if (!response.ok) throw new Error(data.error || "Azura metin kaydı başarısız oldu.");
      const checkResponse = await fetch("/api/admin/azura/experience/text", { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok) throw new Error(checkData.error || "Azura metin kaydı doğrulanamadı.");
      if (JSON.stringify(checkData.experienceText) !== JSON.stringify(data.experienceText) ||
          checkData.revision !== data.revision) {
        throw new Error("Azura kaydedilen metni tekrar okumada farklı döndürdü. Lütfen sayfayı yenileyip kontrol edin.");
      }
      setExperienceText(checkData.experienceText);
      setOriginalText(checkData.experienceText);
      setTextRevision(checkData.revision ?? null);
      setTextSuccess("Azura tanıtım metinleri kaydedildi. Azura anasayfasında değişikliği kontrol edin.");
      return "saved";
    } catch (cause) {
      setTextError(cause.message);
      return "failed";
    } finally {
      setTextSaving(false);
    }
  }

  useImperativeHandle(ref, () => ({ saveImages: save, saveText }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {!embedded && <header className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#507f78]">Azura Deluxe Hotel / Anasayfa</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">Animasyonlu tanıtım alanı</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
          İki görsel ve tanıtım metinleri yalnızca Azura anasayfasını günceller. Lago içerikleri değişmez.
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-stone-200 pt-5">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Düzenleme dili</p>
            <div className="inline-flex max-w-full rounded-xl bg-stone-100 p-1" aria-label="Düzenleme dili">
              {locales.map(([locale, localeLabel]) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setLocalLocale(locale)}
                  title={localeLabel}
                  aria-pressed={activeLocale === locale}
                  className={`relative rounded-lg px-3 py-2 text-xs font-semibold uppercase transition sm:px-4 ${activeLocale === locale ? "bg-[#2f423f] text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-[#2f423f]"}`}
                >
                  {locale}
                  {localeChanged[locale] && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Kaydedilmemiş değişiklik" />}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-stone-500">Görseller tüm dillerde ortak; alt açıklama ve yazılar seçili dil için düzenlenir.</p>
        </div>
      </header>}

      {!canEdit && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p>}

      <form onSubmit={embedded ? (event) => event.preventDefault() : save} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Sayfa görselleri</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">Görseller ve alt açıklamalar</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Azura medya kütüphanesinden seçin veya yeni bir görsel yükleyin. Seçimden sonra anasayfayı kaydedin.</p>
          </div>
          {experience && <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}
          </span>}
        </div>
        {loading && <p className="text-sm text-stone-500">Azura görsel verileri yükleniyor...</p>}
        {mediaLoading && <p className="text-sm text-stone-500">Azura medya kütüphanesi yükleniyor...</p>}
        {mediaError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{mediaError}</p>}
        {mediaSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{mediaSuccess}</p>}
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
        {experience && (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              {images.map(([key, label]) => (
                <section key={key} className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                  <div className="border-b border-stone-200 pb-3">
                    <h3 className="font-semibold text-stone-900">{label}</h3>
                    <p className="mt-1 text-xs text-stone-500">{key === "background" ? "Animasyonun arkasındaki görsel" : "Animasyonun önündeki görsel"}</p>
                  </div>
                  <PageImagePicker
                    label={label}
                    value={experience[key].image}
                    externalAssets={availableImages}
                    externalPreviewUrl={availableImages.find((item) => item.image === experience[key].image)?.previewUrl}
                    externalUpload={(file) => uploadImage(key, file)}
                    externalLoading={mediaLoading}
                    externalError={mediaError}
                    disabled={!canEdit || saving || textSaving || Boolean(uploadingKey)}
                    uploadAccept="image/jpeg,image/png,image/webp"
                    allowClear={false}
                    onChange={(image) => changeImage(key, image)}
                  />
                  <label className="block space-y-2 text-sm font-medium text-stone-700">
                    <span>{locales.find(([locale]) => locale === activeLocale)?.[1]} alt açıklaması</span>
                    <input
                      value={experience[key].translations[activeLocale].alt}
                      onChange={(event) => changeAlt(key, activeLocale, event.target.value)}
                      disabled={!canEdit || saving || textSaving || Boolean(uploadingKey)}
                      required
                      maxLength={300}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#63978f] disabled:bg-stone-100"
                    />
                  </label>
                  <details className="text-xs text-stone-500">
                    <summary className="cursor-pointer hover:text-stone-800">Görsel yolunu elle düzenle</summary>
                    <input
                      aria-label={`${label} görsel yolu`}
                      value={experience[key].image}
                      onChange={(event) => changeImage(key, event.target.value)}
                      disabled={!canEdit || saving || textSaving || Boolean(uploadingKey)}
                      required
                      className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-900 outline-none focus:border-[#63978f] disabled:bg-stone-100"
                    />
                  </details>
                </section>
              ))}
            </div>
            {!embedded && <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
              <button
                type="submit"
                disabled={!canEdit || !changed || saving || textSaving || Boolean(uploadingKey)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
              >
                <FiSave className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Azura görsellerini kaydet"}
              </button>
              <p className="text-xs text-stone-500">Seçim ve alt açıklamalar dört dil için birlikte kaydedilir.</p>
            </div>}
          </>
        )}
      </form>

      <form onSubmit={embedded ? (event) => event.preventDefault() : saveText} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Sayfa metinleri</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">Başlıklar ve tanıtım yazıları</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Şu an {locales.find(([locale]) => locale === activeLocale)?.[1]} metinlerini düzenliyorsunuz. Kaydetme dört dili birlikte gönderir.</p>
          </div>
          {experienceText && <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${textChanged ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {textChanged ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}
          </span>}
        </div>
        {textLoading && <p className="text-sm text-stone-500">Azura metinleri yükleniyor...</p>}
        {textError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{textError}</p>}
        {textSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{textSuccess}</p>}
        {experienceText && (
          <>
            <fieldset disabled={!canEdit || saving || textSaving} className="disabled:opacity-70">
              <ObjectEditor value={experienceText[activeLocale]} onChange={changeText} fieldLimits={textFieldLimits} />
            </fieldset>
            <p className="text-xs text-stone-500">Paragraflarda Enter ile satır sonu eklemeyin; Azura metin API’si bunu kabul etmez.</p>
            {!embedded && <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
              <button
                type="submit"
                disabled={!canEdit || !textChanged || saving || textSaving}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
              >
                <FiSave className="h-4 w-4" />
                {textSaving ? "Kaydediliyor..." : "Tüm dillerin metinlerini kaydet"}
              </button>
              {textChanged && <p className="text-xs font-medium text-amber-700">Kaydedilmemiş metin değişiklikleri var.</p>}
            </div>}
          </>
        )}
      </form>
    </div>
  );
});

export default AzuraExperiencePage;
