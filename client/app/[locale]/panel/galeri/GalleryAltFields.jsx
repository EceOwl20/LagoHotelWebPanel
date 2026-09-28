"use client";
import { useState } from "react";
import { GALLERY_LOCALES } from "@/lib/admin/azura-gallery-model.mjs";

export const emptyGalleryTranslations = () => Object.fromEntries(GALLERY_LOCALES.map((locale) => [locale, { alt: "" }]));

export default function GalleryAltFields({ value, onChange, disabled = false }) {
  const [locale, setLocale] = useState("tr");
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="text-sm font-medium text-stone-700">Görsel açıklamaları — dört dil zorunlu</legend>
    <div className="flex gap-2" aria-label="Alt açıklama dili">
      {GALLERY_LOCALES.map((id) => <button type="button" key={id} aria-pressed={locale === id}
        onClick={() => setLocale(id)} className={`rounded-lg px-3 py-2 text-xs ${locale === id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"}`}>
        {id.toUpperCase()}{value[id]?.alt?.trim() ? " ✓" : ""}
      </button>)}
    </div>
    <label className="block text-sm text-stone-600">
      {locale.toUpperCase()} alt açıklama
      <input value={value[locale]?.alt || ""} maxLength={300}
        onChange={(e) => onChange({ ...value, [locale]: { alt: e.target.value } })}
        className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2" />
    </label>
  </fieldset>;
}
