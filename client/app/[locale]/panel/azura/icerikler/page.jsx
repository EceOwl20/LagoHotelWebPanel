"use client";

import { useCallback, useEffect, useState } from "react";
import { FiFileText, FiGrid, FiImage, FiLayers } from "react-icons/fi";
import AzuraWelcomePage from "../welcome/page";
import AzuraExperiencePage from "../experience/page";
import AzuraHomepageSectionEditor from "./AzuraHomepageSectionEditor";
import AzuraCarouselEditor from "./AzuraCarouselEditor";
import { ContentWorkspaceHeader, ContentWorkspaceNavigation, ContentWorkspaceToolbar } from "../../components/ContentWorkspace";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const sections = [
  { id: "welcome", title: "Karşılama", description: "Videonun altındaki giriş metni", icon: FiFileText },
  { id: "carousel", title: "Keşif kaydırıcısı", description: "Beş görsel kart ve başlıkları", icon: FiLayers },
  { id: "experience", title: "Tanıtım", description: "Animasyonlu görseller ve yazılar", icon: FiImage },
  { id: "essentials", title: "Olanaklar", description: "Altı hizmet maddesi", icon: FiGrid },
];
const localeLabels = Object.fromEntries(locales.map(([locale, label]) => [locale, label]));

export default function AzuraContentsPage() {
  const [activeSection, setActiveSection] = useState("welcome");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [dirtySections, setDirtySections] = useState({ welcome: false, carousel: false, experience: false, essentials: false });
  const markWelcomeDirty = useCallback((dirty) => setDirtySections((current) =>
    current.welcome === dirty ? current : { ...current, welcome: dirty }), []);
  const markExperienceDirty = useCallback((dirty) => setDirtySections((current) =>
    current.experience === dirty ? current : { ...current, experience: dirty }), []);
  const markCarouselDirty = useCallback((dirty) => setDirtySections((current) =>
    current.carousel === dirty ? current : { ...current, carousel: dirty }), []);
  const markEssentialsDirty = useCallback((dirty) => setDirtySections((current) =>
    current.essentials === dirty ? current : { ...current, essentials: dirty }), []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;
  const visibleSections = sections.filter(({ title, description }) =>
    `${title} ${description}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
  );

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
        description="Anasayfanın bölümlerini dört dilde tek çalışma alanından düzenleyin. Her bölümün kaydı ayrıdır; Lago içerikleri değişmez."
        count={sections.length}
        countLabel="bölüm"
        dirty={dirtyCount > 0}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <ContentWorkspaceNavigation
          groups={visibleSections.length ? [{
            id: "home",
            label: "Ana sayfa",
            items: visibleSections.map(({ id, title, description, icon }) => ({
              id,
              label: title,
              code: description,
              type: "Bölüm",
              icon,
              dirty: dirtySections[id],
            })),
          }] : []}
          selectedId={activeSection}
          onSelect={setActiveSection}
          query={query}
          onQueryChange={setQuery}
          footer="Bölüm değiştirmek taslağı silmez; sayfadan ayrılmadan önce her bölümü ayrıca kaydedin."
        />

        <div className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title={sections.find(({ id }) => id === activeSection)?.title}
            code="Azura / Ana sayfa"
            dirty={dirtySections[activeSection]}
            locales={locales.map(([locale]) => locale)}
            localeLabels={localeLabels}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
          >
            <p className="mt-3 text-xs leading-5 text-stone-500">Seçili dil düzenlenir; kayıt dört dilin tamamını doğrular. Kaydetme düğmesi seçili bölümün altındadır.</p>
          </ContentWorkspaceToolbar>
          <section aria-label="Karşılama" className={activeSection === "welcome" ? "" : "hidden"}>
            <AzuraWelcomePage embedded activeLocale={activeLocale} onDirtyChange={markWelcomeDirty} />
          </section>
          <section aria-label="Keşif kaydırıcısı" className={activeSection === "carousel" ? "" : "hidden"}>
            <AzuraCarouselEditor activeLocale={activeLocale} onDirtyChange={markCarouselDirty} />
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
