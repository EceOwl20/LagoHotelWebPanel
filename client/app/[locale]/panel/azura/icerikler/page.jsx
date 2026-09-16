"use client";

import { useCallback, useEffect, useState } from "react";
import AzuraWelcomePage from "../welcome/page";
import AzuraExperiencePage from "../experience/page";
import AzuraHomepageSectionEditor from "./AzuraHomepageSectionEditor";
import AzuraCarouselEditor from "./AzuraCarouselEditor";
import AzuraAccommodationEditor from "./AzuraAccommodationEditor";
import { ContentWorkspaceHeader, ContentWorkspaceNavigation, ContentWorkspaceToolbar } from "../../components/ContentWorkspace";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const localeLabels = Object.fromEntries(locales.map(([locale, label]) => [locale, label]));

export default function AzuraContentsPage() {
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [dirtySections, setDirtySections] = useState({ welcome: false, carousel: false, experience: false, accommodation: false, essentials: false });
  const markWelcomeDirty = useCallback((dirty) => setDirtySections((current) =>
    current.welcome === dirty ? current : { ...current, welcome: dirty }), []);
  const markExperienceDirty = useCallback((dirty) => setDirtySections((current) =>
    current.experience === dirty ? current : { ...current, experience: dirty }), []);
  const markCarouselDirty = useCallback((dirty) => setDirtySections((current) =>
    current.carousel === dirty ? current : { ...current, carousel: dirty }), []);
  const markAccommodationDirty = useCallback((dirty) => setDirtySections((current) =>
    current.accommodation === dirty ? current : { ...current, accommodation: dirty }), []);
  const markEssentialsDirty = useCallback((dirty) => setDirtySections((current) =>
    current.essentials === dirty ? current : { ...current, essentials: dirty }), []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;
  const showHomepage = "ana sayfa anasayfa homepage".includes(query.trim().toLocaleLowerCase("tr"));

  useEffect(() => {
    if (!dirtyCount) return undefined;
    const warnBeforeLeave = (event) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [dirtyCount]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <ContentWorkspaceHeader
        eyebrow="Azura Deluxe Hotel / İçerik yönetimi"
        description="Anasayfanın metin ve görsellerini dört dilde tek çalışma alanında düzenleyin. Lago içerikleri değişmez."
        count={1}
        countLabel="sayfa"
        dirty={dirtyCount > 0}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <ContentWorkspaceNavigation
          groups={showHomepage ? [{
            id: "home",
            label: "Ana sayfa",
            items: [{ id: "homepage", label: "Ana sayfa", code: "HomePage", type: "Sayfa", main: true, dirty: dirtyCount > 0 }],
          }] : []}
          selectedId="homepage"
          onSelect={() => document.getElementById("azura-homepage-editor")?.scrollIntoView({ behavior: "smooth" })}
          query={query}
          onQueryChange={setQuery}
          footer="Anasayfanın tüm içerikleri sağda birlikte görünür. Her kayıt düğmesi yalnızca kendi alanını kaydeder."
        />

        <div id="azura-homepage-editor" className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title="Ana sayfa"
            code="Azura / HomePage"
            dirty={dirtyCount > 0}
            locales={locales.map(([locale]) => locale)}
            localeLabels={localeLabels}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
          >
            <p className="mt-3 text-xs leading-5 text-stone-500">Tüm alanlar aşağıda bir arada. Seçili dil düzenlenir; her alanın kaydı dört dili birlikte doğrular. Azura API’leri ayrı olduğu için kayıt düğmeleri alanların altında bulunur.</p>
          </ContentWorkspaceToolbar>
          <section aria-label="Karşılama">
            <AzuraWelcomePage embedded activeLocale={activeLocale} onDirtyChange={markWelcomeDirty} />
          </section>
          <section aria-label="Keşif kaydırıcısı">
            <AzuraCarouselEditor activeLocale={activeLocale} onDirtyChange={markCarouselDirty} />
          </section>
          <section aria-label="Tanıtım">
            <AzuraExperiencePage embedded activeLocale={activeLocale} onDirtyChange={markExperienceDirty} />
          </section>
          <section aria-label="Oda kartları">
            <AzuraAccommodationEditor activeLocale={activeLocale} onDirtyChange={markAccommodationDirty} />
          </section>
          <section aria-label="Olanaklar">
            <AzuraHomepageSectionEditor sectionKey="essentials" activeLocale={activeLocale} onDirtyChange={markEssentialsDirty} />
          </section>
        </div>
      </div>
    </div>
  );
}
