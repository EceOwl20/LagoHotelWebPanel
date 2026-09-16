"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { isValidWelcomeText } from "@/lib/admin/azura-welcome-text.mjs";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const fields = [
  ["subtitle", "Üst başlık", 200, false],
  ["title", "Ana başlık", 250, false],
  ["text", "Paragraf", 2000, true],
  ["buttonText", "Hakkımızda düğmesi", 120, false],
];

function validateDraft(value) {
  for (const [locale, localeLabel] of locales) {
    if (!value?.[locale]) return `${localeLabel} metinleri eksik.`;
    for (const [field, label, maxLength] of fields) {
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

export default function AzuraWelcomePage({ embedded = false, activeLocale: selectedLocale, onDirtyChange }) {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const [welcomeText, setWelcomeText] = useState(null);
  const [original, setOriginal] = useState(null);
  const [revision, setRevision] = useState(null);
  const [localLocale, setLocalLocale] = useState("tr");
  const activeLocale = selectedLocale || localLocale;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/azura/welcome/text", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura karşılama metinleri alınamadı.");
        if (!cancelled) {
          setWelcomeText(data.welcomeText);
          setOriginal(data.welcomeText);
          setRevision(data.revision);
        }
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const changed = welcomeText && original &&
    JSON.stringify(welcomeText) !== JSON.stringify(original);
  useEffect(() => {
    onDirtyChange?.(Boolean(changed));
  }, [changed, onDirtyChange]);
  const localeChanged = Object.fromEntries(locales.map(([locale]) => [locale,
    Boolean(welcomeText && original &&
      JSON.stringify(welcomeText[locale]) !== JSON.stringify(original[locale]))
  ]));

  function changeText(locale, field, value) {
    setError("");
    setSuccess("");
    setWelcomeText((current) => ({
      ...current,
      [locale]: { ...current[locale], [field]: value },
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!canEdit || !changed || saving) return;
    const validationError = validateDraft(welcomeText);
    if (validationError || !isValidWelcomeText(welcomeText)) {
      setError(validationError || "Azura karşılama metinleri geçersiz.");
      setSuccess("");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/azura/welcome/text", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ welcomeText, revision }),
      });
      const data = await response.json();
      if (response.status === 409) {
        throw new Error("Karşılama metinleri başka bir sekmede veya kullanıcı tarafından değiştirildi. Kendi değişikliklerinizi kopyalayıp sayfayı yenileyin; eski veriyle kayıt yapılmadı.");
      }
      if (!response.ok) throw new Error(data.error || "Azura karşılama metni kaydedilemedi.");

      const checkResponse = await fetch("/api/admin/azura/welcome/text", { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok) throw new Error(checkData.error || "Azura karşılama metni doğrulanamadı.");
      if (JSON.stringify(checkData.welcomeText) !== JSON.stringify(data.welcomeText) ||
          checkData.revision !== data.revision) {
        throw new Error("Azura kaydedilen metni tekrar okumada farklı döndürdü. Sayfayı yenileyip kontrol edin.");
      }
      setWelcomeText(checkData.welcomeText);
      setOriginal(checkData.welcomeText);
      setRevision(checkData.revision);
      setSuccess("Karşılama metinleri kaydedildi. Azura anasayfasında değişikliği kontrol edin.");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {!embedded && <header className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#507f78]">Azura Deluxe Hotel / Anasayfa</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">Karşılama metni</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
          Bu metinler Azura anasayfasında videonun altındaki karşılama bölümünü günceller. Lago içerikleri değişmez.
        </p>
        <div className="mt-5 border-t border-stone-200 pt-5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Düzenleme dili</p>
          <div className="inline-flex max-w-full rounded-xl bg-stone-100 p-1" aria-label="Düzenleme dili">
            {locales.map(([locale, label]) => (
              <button
                key={locale}
                type="button"
                onClick={() => setLocalLocale(locale)}
                title={label}
                aria-pressed={activeLocale === locale}
                className={`relative rounded-lg px-3 py-2 text-xs font-semibold uppercase transition sm:px-4 ${activeLocale === locale ? "bg-[#2f423f] text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-[#2f423f]"}`}
              >
                {locale}
                {localeChanged[locale] && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Kaydedilmemiş değişiklik" />}
              </button>
            ))}
          </div>
        </div>
      </header>}

      {!canEdit && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p>}

      <form onSubmit={save} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Sayfa metinleri</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">{locales.find(([locale]) => locale === activeLocale)?.[1]} karşılama metni</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Kaydetme dört dili birlikte gönderir. Düğme bağlantısı sabit olarak /about sayfasına gider.</p>
          </div>
          {welcomeText && <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}
          </span>}
        </div>
        {loading && <p className="text-sm text-stone-500">Azura karşılama metinleri yükleniyor...</p>}
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
        {welcomeText && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map(([field, label, maxLength, multiline]) => (
                <label key={field} className={`block space-y-2 text-sm font-medium text-stone-700 ${multiline ? "md:col-span-2" : ""}`}>
                  <span>{label}</span>
                  {multiline ? (
                    <textarea
                      value={welcomeText[activeLocale][field]}
                      onChange={(event) => changeText(activeLocale, field, event.target.value)}
                      disabled={!canEdit || saving}
                      maxLength={maxLength}
                      rows={4}
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#63978f] focus:bg-white disabled:bg-stone-100"
                    />
                  ) : (
                    <input
                      value={welcomeText[activeLocale][field]}
                      onChange={(event) => changeText(activeLocale, field, event.target.value)}
                      disabled={!canEdit || saving}
                      maxLength={maxLength}
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#63978f] focus:bg-white disabled:bg-stone-100"
                    />
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-stone-500">Paragrafta Enter ile satır sonu eklemeyin; Azura metin API’si bunu kabul etmez.</p>
            <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
              <button
                type="submit"
                disabled={!canEdit || !changed || saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
              >
                <FiSave className="h-4 w-4" />
                {saving ? "Kaydediliyor..." : "Tüm dillerin metinlerini kaydet"}
              </button>
              {changed && <p className="text-xs font-medium text-amber-700">Kaydedilmemiş metin değişiklikleri var.</p>}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
