"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  AZURA_HOMEPAGE_SECTION_FIELDS,
  isValidAzuraHomepageSection,
} from "@/lib/admin/azura-homepage-section.mjs";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];

const sectionDefinitions = {
  essentials: {
    title: "Olanaklar",
    description: "Azura anasayfasındaki altı hizmet maddesinin başlık ve açıklamaları.",
    intro: [
      ["subtitle", "Üst başlık"],
      ["title", "Ana başlık"],
    ],
    items: [1, 2, 3, 4, 5, 6],
    end: [["buttonText", "Düğme metni"]],
  },
};

function validateDraft(sectionKey, value) {
  const fields = AZURA_HOMEPAGE_SECTION_FIELDS[sectionKey];
  for (const [locale, localeLabel] of locales) {
    if (!value?.[locale]) return `${localeLabel} metinleri eksik.`;
    for (const [field, limit] of Object.entries(fields)) {
      const text = value[locale][field];
      if (typeof text !== "string" || !text.trim()) return `${localeLabel} · ${field} boş olamaz.`;
      if (text.length > limit) return `${localeLabel} · ${field} çok uzun.`;
      if (/[\u0000-\u001f\u007f]/.test(text)) {
        return `${localeLabel} · ${field} satır sonu veya kontrol karakteri içeremez.`;
      }
    }
  }
  return "";
}

export default function AzuraHomepageSectionEditor({ sectionKey, activeLocale, onDirtyChange }) {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const [section, setSection] = useState(null);
  const [original, setOriginal] = useState(null);
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const config = sectionDefinitions[sectionKey];
  const apiPath = `/api/admin/azura/homepage/sections/${sectionKey}`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(apiPath, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura bölüm içeriği alınamadı.");
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
    load();
    return () => { cancelled = true; };
  }, [apiPath]);

  const changed = section && original && JSON.stringify(section) !== JSON.stringify(original);
  useEffect(() => {
    onDirtyChange?.(Boolean(changed));
  }, [changed, onDirtyChange]);

  if (!config) return null;

  function change(field, value) {
    setError("");
    setSuccess("");
    setSection((current) => ({
      ...current,
      [activeLocale]: { ...current[activeLocale], [field]: value },
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!canEdit || !changed || saving) return;
    const validationError = validateDraft(sectionKey, section);
    if (validationError || !isValidAzuraHomepageSection(sectionKey, section)) {
      setError(validationError || "Azura bölüm metinleri geçersiz.");
      setSuccess("");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(apiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, revision }),
      });
      const data = await response.json();
      if (response.status === 409) {
        throw new Error("Bu bölüm başka bir sekmede veya kullanıcı tarafından değiştirildi. Kendi değişikliklerinizi kopyalayıp sayfayı yenileyin; eski veriyle kayıt yapılmadı.");
      }
      if (!response.ok) throw new Error(data.error || "Azura bölüm metinleri kaydedilemedi.");

      const checkResponse = await fetch(apiPath, { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok) throw new Error(checkData.error || "Azura bölüm kaydı doğrulanamadı.");
      if (JSON.stringify(checkData.section) !== JSON.stringify(data.section) ||
          checkData.revision !== data.revision) {
        throw new Error("Azura kaydedilen metni tekrar okumada farklı döndürdü. Sayfayı yenileyip kontrol edin.");
      }
      setSection(checkData.section);
      setOriginal(checkData.section);
      setRevision(checkData.revision);
      setSuccess("Azura olanaklar bölümü kaydedildi. Anasayfada değişikliği kontrol edin.");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  function fieldInput(field, label, multiline = false) {
    const shared = {
      value: section[activeLocale][field],
      onChange: (event) => change(field, event.target.value),
      disabled: !canEdit || saving,
      maxLength: AZURA_HOMEPAGE_SECTION_FIELDS[sectionKey][field],
      className: "w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none focus:border-[#63978f] focus:bg-white disabled:bg-stone-100",
    };
    return (
      <label key={field} className="block space-y-2 text-sm font-medium text-stone-700">
        <span>{label}</span>
        {multiline ? <textarea {...shared} rows={4} /> : <input {...shared} />}
      </label>
    );
  }

  return (
    <form onSubmit={save} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Anasayfa bölümü</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">{config.title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{config.description} Kaydetme dört dili birlikte gönderir.</p>
        </div>
        {section && <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
          {changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}
        </span>}
      </div>
      {!canEdit && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p>}
      {loading && <p className="text-sm text-stone-500">Azura olanaklar metinleri yükleniyor...</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}
      {section && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {config.intro.map(([field, label]) => fieldInput(field, label))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {config.items.map((number) => (
              <fieldset key={number} className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold text-stone-900">{number}. olanak</legend>
                {fieldInput(`title${number}`, "Başlık")}
                {fieldInput(`text${number}`, "Açıklama", true)}
              </fieldset>
            ))}
          </div>
          <div className="max-w-xl">{config.end.map(([field, label]) => fieldInput(field, label))}</div>
          <p className="text-xs text-stone-500">Açıklamalarda Enter ile satır sonu eklemeyin; Azura API’si bunu kabul etmez.</p>
          <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
            <button type="submit" disabled={!canEdit || !changed || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{saving ? "Kaydediliyor..." : "Tüm dillerin metinlerini kaydet"}
            </button>
            {changed && <p className="text-xs font-medium text-amber-700">Kaydedilmemiş metin değişiklikleri var.</p>}
          </div>
        </>
      )}
    </form>
  );
}
