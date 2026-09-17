"use client";

import { useCallback, useEffect, useState } from "react";
import AzuraWelcomePage from "../welcome/page";
import AzuraExperiencePage from "../experience/page";
import AzuraHomepageSectionEditor from "./AzuraHomepageSectionEditor";
import AzuraCarouselEditor from "./AzuraCarouselEditor";
import AzuraAccommodationEditor from "./AzuraAccommodationEditor";
import AzuraBackgroundEditor from "./AzuraBackgroundEditor";
import AzuraContactDetailsEditor from "./AzuraContactDetailsEditor";
import { ContentWorkspaceHeader, ContentWorkspaceNavigation, ContentWorkspaceToolbar } from "../../components/ContentWorkspace";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const localeLabels = Object.fromEntries(locales.map(([locale, label]) => [locale, label]));

export default function AzuraContentsPage() {
  const [selectedId, setSelectedId] = useState("homepage");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [dirtySections, setDirtySections] = useState({ welcome: false, carousel: false, experience: false, accommodation: false, essentials: false, background: false, contact: false });
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
  const markBackgroundDirty = useCallback((dirty) => setDirtySections((current) =>
    current.background === dirty ? current : { ...current, background: dirty }), []);
  const markContactDirty = useCallback((dirty) => setDirtySections((current) =>
    current.contact === dirty ? current : { ...current, contact: dirty }), []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;
  const homepageDirty = Object.entries(dirtySections).some(([key, dirty]) => key !== "contact" && dirty);
  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const showHomepage = "ana sayfa anasayfa homepage".includes(normalizedQuery);
  const showContact = "genel alanlar iletişim iletişim bilgileri contact".includes(normalizedQuery);

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
        description="Azura anasayfasını ve ortak iletişim bilgilerini dört dilde düzenleyin. Lago içerikleri değişmez."
        count={2}
        countLabel="içerik"
        dirty={dirtyCount > 0}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <ContentWorkspaceNavigation
          groups={[
            ...(showContact ? [{
              id: "general",
              label: "Genel alanlar",
              items: [{ id: "contact", label: "İletişim bilgileri", code: "ContactSection", type: "Ortak bölüm", dirty: dirtySections.contact }],
            }] : []),
            ...(showHomepage ? [{
              id: "home",
              label: "Ana sayfa",
              items: [{ id: "homepage", label: "Ana sayfa", code: "HomePage", type: "Sayfa", main: true, dirty: homepageDirty }],
            }] : []),
          ]}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            document.getElementById("azura-content-editor")?.scrollIntoView({ behavior: "smooth" });
          }}
          query={query}
          onQueryChange={setQuery}
          footer="Bölüm değiştirmek kaydedilmemiş taslakları silmez. Her kayıt düğmesi yalnızca kendi alanını kaydeder."
        />

        <div id="azura-content-editor" className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title={selectedId === "contact" ? "İletişim bilgileri" : "Ana sayfa"}
            code={selectedId === "contact" ? "Azura / ContactSection" : "Azura / HomePage"}
            dirty={selectedId === "contact" ? dirtySections.contact : homepageDirty}
            locales={locales.map(([locale]) => locale)}
            localeLabels={localeLabels}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
          >
            <p className="mt-3 text-xs leading-5 text-stone-500">{selectedId === "contact" ? "İletişim verisi anasayfa içeriğinden ayrı saklanır. Şimdilik anasayfadaki ContactSection bileşenini yönetir." : "Anasayfanın alanları aşağıda bir arada. Seçili dil düzenlenir; her alanın kaydı dört dili birlikte doğrular."}</p>
          </ContentWorkspaceToolbar>
          <div className={selectedId === "homepage" ? "space-y-5" : "hidden"}>
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
          <section aria-label="Arka planlı tanıtım">
            <AzuraBackgroundEditor activeLocale={activeLocale} onDirtyChange={markBackgroundDirty} />
          </section>
          </div>
          <section aria-label="Genel iletişim bilgileri" className={selectedId === "contact" ? "" : "hidden"}>
            <AzuraContactDetailsEditor activeLocale={activeLocale} onDirtyChange={markContactDirty} />
          </section>
        </div>
      </div>
    </div>
  );
}
