"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import ObjectEditor from "../../components/ObjectEditor";
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

const AzuraHomepageSectionEditor = forwardRef(function AzuraHomepageSectionEditor({ sectionKey, activeLocale, onDirtyChange }, ref) {
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

  function change(updater) {
    setError("");
    setSuccess("");
    setSection((current) => ({
      ...current,
      [activeLocale]: updater(current[activeLocale]),
    }));
  }

  async function save(event) {
    event?.preventDefault();
    if (!changed) return "skipped";
    if (!canEdit || saving) return "failed";
    const validationError = validateDraft(sectionKey, section);
    if (validationError || !isValidAzuraHomepageSection(sectionKey, section)) {
      setError(validationError || "Azura bölüm metinleri geçersiz.");
      setSuccess("");
      return "failed";
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
      return "saved";
    } catch (cause) {
      setError(cause.message);
      return "failed";
    } finally {
      setSaving(false);
    }
  }

  useImperativeHandle(ref, () => ({ save }));

  if (!config) return null;

  return (
    <form onSubmit={(event) => event.preventDefault()} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
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
          <fieldset disabled={!canEdit || saving} className="disabled:opacity-70">
            <ObjectEditor value={section[activeLocale]} onChange={change} fieldLimits={AZURA_HOMEPAGE_SECTION_FIELDS[sectionKey]} />
          </fieldset>
          <p className="text-xs text-stone-500">Açıklamalarda Enter ile satır sonu eklemeyin; Azura API’si bunu kabul etmez.</p>
          {changed && <p className="text-xs font-medium text-amber-700">Kaydedilmemiş metin değişiklikleri var.</p>}
        </>
      )}
    </form>
  );
});

export default AzuraHomepageSectionEditor;
