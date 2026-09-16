"use client";

import { useCallback, useEffect, useState } from "react";
import { FiFileText, FiGrid, FiImage } from "react-icons/fi";
import AzuraWelcomePage from "../welcome/page";
import AzuraExperiencePage from "../experience/page";
import AzuraHomepageSectionEditor from "./AzuraHomepageSectionEditor";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const sections = [
  { id: "welcome", title: "Karşılama", description: "Videonun altındaki giriş metni", icon: FiFileText },
  { id: "experience", title: "Tanıtım", description: "Animasyonlu görseller ve yazılar", icon: FiImage },
  { id: "essentials", title: "Olanaklar", description: "Altı hizmet maddesi", icon: FiGrid },
];

export default function AzuraContentsPage() {
  const [activeSection, setActiveSection] = useState("welcome");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [dirtySections, setDirtySections] = useState({ welcome: false, experience: false, essentials: false });
  const markWelcomeDirty = useCallback((dirty) => setDirtySections((current) =>
    current.welcome === dirty ? current : { ...current, welcome: dirty }), []);
  const markExperienceDirty = useCallback((dirty) => setDirtySections((current) =>
    current.experience === dirty ? current : { ...current, experience: dirty }), []);
  const markEssentialsDirty = useCallback((dirty) => setDirtySections((current) =>
    current.essentials === dirty ? current : { ...current, essentials: dirty }), []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;

  useEffect(() => {
    if (!dirtyCount) return undefined;
    const warnBeforeLeave = (event) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirtyCount]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#507f78]">Azura Deluxe Hotel / İçerik yönetimi</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">Sayfa İçerikleri</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
          Anasayfanın bölümlerini tek yerden düzenleyin. Her bölümün kaydı ayrıdır; Lago içerikleri değişmez.
        </p>
        {dirtyCount > 0 && <p role="status" className="mt-3 text-xs font-semibold text-amber-700">{dirtyCount} bölümde kaydedilmemiş değişiklik var.</p>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="self-start rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Anasayfa</p>
          <nav aria-label="Azura anasayfa bölümleri" className="mt-3 space-y-1">
            {sections.map(({ id, title, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id ? "page" : undefined}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${activeSection === id ? "bg-[#e6f0ed] text-[#2f423f]" : "text-stone-600 hover:bg-stone-50"}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-stone-500">{description}</span>
                </span>
                {dirtySections[id] && <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-label="Kaydedilmemiş değişiklik" />}
              </button>
            ))}
          </nav>
          <p className="mt-5 border-t border-stone-200 px-2 pt-4 text-xs leading-5 text-stone-500">
            Bölüm değiştirmek taslağı silmez; sayfadan ayrılmadan önce her bölümü ayrıca kaydedin.
          </p>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Düzenleme dili</p>
              <div className="mt-2 inline-flex max-w-full rounded-xl bg-stone-100 p-1" aria-label="Düzenleme dili">
                {locales.map(([locale, label]) => (
                  <button
                    key={locale}
                    type="button"
                    title={label}
                    onClick={() => setActiveLocale(locale)}
                    aria-pressed={activeLocale === locale}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase transition sm:px-4 ${activeLocale === locale ? "bg-[#2f423f] text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-[#2f423f]"}`}
                  >
                    {locale}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs leading-5 text-stone-500">Seçili dil düzenlenir; kayıt dört dilin tamamını doğrular.</p>
          </div>

          <section aria-label="Karşılama" className={activeSection === "welcome" ? "" : "hidden"}>
            <AzuraWelcomePage embedded activeLocale={activeLocale} onDirtyChange={markWelcomeDirty} />
          </section>
          <section aria-label="Tanıtım" className={activeSection === "experience" ? "" : "hidden"}>
            <AzuraExperiencePage embedded activeLocale={activeLocale} onDirtyChange={markExperienceDirty} />
          </section>
          <section aria-label="Olanaklar" className={activeSection === "essentials" ? "" : "hidden"}>
            <AzuraHomepageSectionEditor sectionKey="essentials" activeLocale={activeLocale} onDirtyChange={markEssentialsDirty} />
          </section>
        </div>
      </div>
    </div>
  );
}
