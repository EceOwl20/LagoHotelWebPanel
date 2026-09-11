"use client";

import { FiFileText, FiGlobe, FiLayers } from "react-icons/fi";
import PageHistoryPanel from "./PageHistoryPanel";

export default function PageBuilderHeader({
  pageId,
  draft,
  editingPageTitle,
  hasUnsavedChanges,
}) {
  const isEditing = Boolean(pageId);

  return (
    <header className="relative overflow-hidden rounded-3xl bg-[#2f423f] px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">
            Sayfalar / İçerik oluşturucu
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {isEditing ? "Sayfa taslağını düzenle" : "Yeni sayfa hazırla"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">
            Sayfa yapısını, dört dildeki içerikleri ve yayın ayarlarını tek bir çalışma
            alanından düzenleyin.
          </p>
          {isEditing ? (
            <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#b9d6d1]">
                <FiFileText className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a9c9c4]">
                  Düzenlenen sayfa
                </span>
                <span className="mt-0.2 block truncate text-xs font-semibold text-white md:text-sm">
                  {editingPageTitle}
                </span>
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <PageHistoryPanel pageId={pageId} currentDraft={draft} />
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
            <FiLayers className="h-4 w-4 text-[#a9c9c4]" />
            {draft.sections.length} component
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
            <FiGlobe className="h-4 w-4 text-[#a9c9c4]" />
            4 dil
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            {draft.status === "published" ? "Yayında" : "Taslak"}
          </span>
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-xs text-amber-100 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Kaydedilmemiş değişiklik
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
