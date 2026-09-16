"use client";

import {
  FiCheck,
  FiChevronRight,
  FiCoffee,
  FiCompass,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiHome,
  FiLayers,
  FiSearch,
  FiSettings,
  FiX,
} from "react-icons/fi";

const groupVisuals = {
  general: { icon: FiSettings, iconClass: "bg-[#edf5f3] text-[#507f78]", itemIconClass: "bg-[#dcece9]/80 text-[#507f78]", headerClass: "bg-[#edf5f3]/60", borderClass: "border-[#63978f]/20", accentClass: "bg-[#63978f]" },
  home: { icon: FiHome, iconClass: "bg-amber-100 text-amber-700", itemIconClass: "bg-amber-100/80 text-amber-700", headerClass: "bg-amber-50/60", borderClass: "border-amber-200/70", accentClass: "bg-amber-400" },
  rooms: { icon: FiGrid, iconClass: "bg-sky-100 text-sky-700", itemIconClass: "bg-sky-100/80 text-sky-700", headerClass: "bg-sky-50/60", borderClass: "border-sky-200/70", accentClass: "bg-sky-400" },
  food: { icon: FiCoffee, iconClass: "bg-orange-100 text-orange-700", itemIconClass: "bg-orange-100/80 text-orange-700", headerClass: "bg-orange-50/60", borderClass: "border-orange-200/70", accentClass: "bg-orange-400" },
  pages: { icon: FiCompass, iconClass: "bg-violet-100 text-violet-700", itemIconClass: "bg-violet-100/80 text-violet-700", headerClass: "bg-violet-50/60", borderClass: "border-violet-200/70", accentClass: "bg-violet-400" },
  other: { icon: FiLayers, iconClass: "bg-violet-100 text-violet-700", itemIconClass: "bg-violet-100/80 text-violet-700", headerClass: "bg-violet-50/60", borderClass: "border-violet-200/70", accentClass: "bg-violet-400" },
};

export function ContentWorkspaceHeader({ eyebrow = "İçerik yönetimi / Sayfa içerikleri", title = "İçerik düzenleyici", description, count, countLabel = "içerik grubu", loading = false, dirty = false }) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-lagoBlack px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
            <FiLayers className="h-4 w-4 text-[#a9c9c4]" />
            {loading ? "Yükleniyor" : `${count} ${countLabel}`}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
            <FiGlobe className="h-4 w-4 text-[#a9c9c4]" />4 dil
          </span>
          {dirty ? <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-2 text-xs text-amber-100 backdrop-blur-sm"><span className="h-2 w-2 rounded-full bg-amber-300" />Kaydedilmemiş değişiklik</span> : null}
        </div>
      </div>
    </header>
  );
}

export function ContentWorkspaceNavigation({ groups, selectedId, onSelect, query, onQueryChange, loading = false, footer }) {
  return (
    <aside className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-20">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63978f]">İçerik navigasyonu</p><p className="mt-1.5 font-semibold text-stone-900">Sayfa veya bölüm seçin</p></div>
          <span className="rounded-xl bg-[#edf5f3] p-2.5 text-[#507f78]"><FiFileText className="h-5 w-5" aria-hidden="true" /></span>
        </div>
        <label className="relative mt-3 block">
          <span className="sr-only">Sayfalarda ara</span>
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Sayfa veya bölüm ara..." className="w-full rounded-xl border border-stone-200 bg-white py-1.5 pl-10 pr-9 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10" />
          {query ? <button type="button" onClick={() => onQueryChange("")} aria-label="Aramayı temizle" className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"><FiX className="h-3.5 w-3.5" /></button> : null}
        </label>
      </div>
      <div className="max-h-[calc(100vh-12rem)] space-y-3 overflow-y-auto p-3">
        {loading ? <div className="space-y-2 p-1">{[1, 2, 3, 4].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-stone-100" />)}</div> : groups.length ? groups.map((group) => {
          const visual = groupVisuals[group.id] || groupVisuals.other;
          const GroupIcon = visual.icon;
          return <section key={group.id} className={`overflow-hidden rounded-2xl border bg-white ${visual.borderClass}`}>
            <div className={`relative flex items-center gap-3 border-b px-3 py-3 ${visual.headerClass} ${visual.borderClass}`}>
              <span aria-hidden="true" className={`absolute bottom-0 left-0 top-0 w-1 ${visual.accentClass}`} />
              <span className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${visual.iconClass}`}><GroupIcon className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-stone-700">{group.label}</p><p className="mt-0.5 text-[10px] text-stone-400">{group.items.length} içerik</p></div>
            </div>
            <div className="divide-y divide-stone-100">{group.items.map((item) => {
              const selected = selectedId === item.id;
              const ItemIcon = item.icon || (item.main ? FiHome : FiFileText);
              return <button key={item.id} type="button" onClick={() => onSelect(item.id)} aria-current={selected ? "page" : undefined} className={`group relative flex w-full items-center gap-3 py-3 pr-3 text-left transition ${item.detail ? "pl-6" : "pl-3"} ${selected ? "bg-[#2f423f] text-white" : item.main ? "bg-stone-50/70 text-stone-800 hover:bg-[#edf5f3]" : "bg-white text-stone-700 hover:bg-[#edf5f3]/70"}`}>
                {item.detail && !selected ? <span aria-hidden="true" className="absolute bottom-0 left-[17px] top-0 w-px bg-stone-200" /> : null}
                {selected ? <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#8bc3ba]" /> : null}
                <span className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition duration-200 ${selected ? "bg-white/10 text-white" : `${visual.itemIconClass} ${item.main ? "shadow-sm ring-1 ring-black/5" : ""}`}`}>
                  {selected ? <FiCheck className="h-4 w-4" aria-hidden="true" /> : <ItemIcon className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1"><span className={`block truncate text-sm ${item.main ? "font-semibold" : "font-medium"}`}>{item.label}</span><span className="mt-1 flex min-w-0 items-center gap-1.5"><span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${selected ? "bg-white/10 text-stone-200" : item.main ? "bg-[#63978f]/10 text-[#507f78]" : "bg-stone-100 text-stone-500"}`}>{item.type}</span><span className="min-w-0 truncate font-mono text-[9px] text-stone-400">{item.code || item.id}</span></span></span>
                {item.dirty ? <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" title="Kaydedilmemiş değişiklik" /> : null}
                <FiChevronRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${selected ? "text-[#a9c9c4]" : "text-stone-300"}`} aria-hidden="true" />
              </button>;
            })}</div>
          </section>;
        }) : <p className="rounded-xl bg-stone-50 p-4 text-center text-sm text-stone-500">Aramanızla eşleşen sayfa bulunamadı.</p>}
        {footer ? <div className="border-t border-stone-200 px-2 pt-4 text-xs leading-5 text-stone-500">{footer}</div> : null}
      </div>
    </aside>
  );
}

export function ContentLanguageTabs({ locales, labels, activeLocale, onChange }) {
  return <div className="min-w-0"><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Düzenleme dili</p><div className="inline-flex max-w-full rounded-xl bg-stone-100 p-1" aria-label="Düzenleme dili">{locales.map((locale) => <button key={locale} type="button" onClick={() => onChange(locale)} title={labels[locale]} aria-pressed={activeLocale === locale} className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase transition sm:px-4 ${activeLocale === locale ? "bg-[#2f423f] text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-[#2f423f]"}`}>{locale}</button>)}</div></div>;
}

export function ContentWorkspaceToolbar({ title, code, dirty, current, locales, localeLabels, activeLocale, onLocaleChange, actions, children }) {
  return <section className="z-10 overflow-hidden rounded-3xl border border-stone-200 bg-white/95 shadow-sm backdrop-blur lg:sticky lg:top-16">
    <div className="h-1 bg-gradient-to-r from-[#2f423f] via-[#63978f] to-[#a9c9c4]" />
    <div className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3.5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf5f3] text-[#507f78]"><FiEdit3 className="h-5 w-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Düzenlenen içerik</p>{dirty ? <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Kaydedilmedi</span> : current ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><FiCheck className="h-3 w-3" />Güncel</span> : null}</div><h2 className="mt-1 truncate text-xl font-semibold text-stone-900 sm:text-2xl">{title || "Sayfa seçin"}</h2>{code ? <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">{code}</p> : null}</div></div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><ContentLanguageTabs locales={locales} labels={localeLabels} activeLocale={activeLocale} onChange={onLocaleChange} />{actions}</div>
    </div>{children}</div>
  </section>;
}
