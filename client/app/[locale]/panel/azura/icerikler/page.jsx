"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiSave } from "react-icons/fi";
import AzuraWelcomePage from "../welcome/page";
import AzuraExperiencePage from "../experience/page";
import AzuraHomepageSectionEditor from "./AzuraHomepageSectionEditor";
import AzuraCarouselEditor from "./AzuraCarouselEditor";
import AzuraAccommodationEditor from "./AzuraAccommodationEditor";
import AzuraBackgroundEditor from "./AzuraBackgroundEditor";
import AzuraContactDetailsEditor from "./AzuraContactDetailsEditor";
import AzuraRoomsEditor from "./AzuraRoomsEditor";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { saveAzuraHomepageSteps } from "@/lib/admin/azura-homepage-save.mjs";
import { ContentWorkspaceHeader, ContentWorkspaceNavigation, ContentWorkspaceToolbar } from "../../components/ContentWorkspace";

const locales = [
  ["tr", "Türkçe"],
  ["en", "İngilizce"],
  ["de", "Almanca"],
  ["ru", "Rusça"],
];
const localeLabels = Object.fromEntries(locales.map(([locale, label]) => [locale, label]));

export default function AzuraContentsPage() {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const welcomeRef = useRef(null);
  const carouselRef = useRef(null);
  const experienceRef = useRef(null);
  const accommodationRef = useRef(null);
  const essentialsRef = useRef(null);
  const backgroundRef = useRef(null);
  const roomsRef = useRef(null);
  const [selectedId, setSelectedId] = useState("homepage");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [roomsNotice, setRoomsNotice] = useState(null);
  const [dirtySections, setDirtySections] = useState({ welcome: false, carousel: false, experience: false, accommodation: false, essentials: false, background: false, contact: false, rooms: false });
  const markWelcomeDirty = useCallback((dirty) => {
    if (dirty) setSaveNotice(null);
    setDirtySections((current) => current.welcome === dirty ? current : { ...current, welcome: dirty });
  }, []);
  const markExperienceDirty = useCallback((dirty) => {
    if (dirty) setSaveNotice(null);
    setDirtySections((current) => current.experience === dirty ? current : { ...current, experience: dirty });
  }, []);
  const markCarouselDirty = useCallback((dirty) => {
    if (dirty) setSaveNotice(null);
    setDirtySections((current) => current.carousel === dirty ? current : { ...current, carousel: dirty });
  }, []);
  const markAccommodationDirty = useCallback((dirty) => {
    if (dirty) setSaveNotice(null);
    setDirtySections((current) => current.accommodation === dirty ? current : { ...current, accommodation: dirty });
  }, []);
  const markEssentialsDirty = useCallback((dirty) => {
    if (dirty) setSaveNotice(null);
    setDirtySections((current) => current.essentials === dirty ? current : { ...current, essentials: dirty });
  }, []);
  const markBackgroundDirty = useCallback((dirty) => {
    if (dirty) setSaveNotice(null);
    setDirtySections((current) => current.background === dirty ? current : { ...current, background: dirty });
  }, []);
  const markContactDirty = useCallback((dirty) => setDirtySections((current) =>
    current.contact === dirty ? current : { ...current, contact: dirty }), []);
  const markRoomsDirty = useCallback((dirty) => {
    if (dirty) setRoomsNotice(null);
    setDirtySections((current) => current.rooms === dirty ? current : { ...current, rooms: dirty });
  }, []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;
  const homepageDirty = Object.entries(dirtySections).some(([key, dirty]) => key !== "contact" && key !== "rooms" && dirty);
  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const showHomepage = "ana sayfa anasayfa homepage".includes(normalizedQuery);
  const showContact = "genel alanlar iletişim iletişim bilgileri contact".includes(normalizedQuery);
  const showRooms = "odalar oda sayfası accommodation rooms".includes(normalizedQuery);

  async function saveRooms() {
    if (!canEdit || !dirtySections.rooms || savingRooms) return;
    setSavingRooms(true);
    setRoomsNotice(null);
    try {
      const result = await roomsRef.current?.save() ?? "failed";
      if (result === "saved") {
        setRoomsNotice({ kind: "success", text: "Azura oda sayfası kaydedildi. Değişiklikleri Azura sitesinde kontrol edin." });
      } else if (result === "failed") {
        setRoomsNotice({ kind: "error", text: "Oda sayfası kaydedilemedi. Aşağıdaki hata mesajını kontrol edin." });
      }
    } finally {
      setSavingRooms(false);
    }
  }

  async function saveHomepage() {
    if (!canEdit || !homepageDirty || savingHomepage) return;
    setSavingHomepage(true);
    setSaveNotice(null);
    const steps = [
      { id: "welcome", label: "Karşılama", save: () => welcomeRef.current?.save() ?? "failed" },
      { id: "carousel", label: "Keşif kaydırıcısı", save: () => carouselRef.current?.save() ?? "failed" },
      { id: "experience", label: "Tanıtım görselleri", save: () => experienceRef.current?.saveImages() ?? "failed" },
      { id: "experience", label: "Tanıtım metinleri", save: () => experienceRef.current?.saveText(undefined, true) ?? "failed" },
      { id: "accommodation", label: "Oda kartları", save: () => accommodationRef.current?.save() ?? "failed" },
      { id: "essentials", label: "Olanaklar", save: () => essentialsRef.current?.save() ?? "failed" },
      { id: "background", label: "Arka planlı tanıtım", save: () => backgroundRef.current?.save() ?? "failed" },
    ];
    try {
      const { saved, failed } = await saveAzuraHomepageSteps(steps);
      if (failed) {
        setSaveNotice({
          kind: "error",
          text: `${failed.label} kaydedilemedi. ${saved.length ? `${saved.length} alan kaydedildi; ` : ""}diğer alanlar bekliyor. Bölümdeki hata mesajını kontrol edin.`,
        });
        document.getElementById(`azura-homepage-${failed.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setSaveNotice({ kind: "success", text: `${saved.length} alan kaydedildi. Azura anasayfasındaki değişiklikleri kontrol edin.` });
      }
    } finally {
      setSavingHomepage(false);
    }
  }

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
        description="Azura anasayfasını, oda sayfasını ve ortak iletişim bilgilerini dört dilde düzenleyin. Lago içerikleri değişmez."
        count={3}
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
            ...(showRooms ? [{
              id: "rooms",
              label: "Odalar",
              items: [{ id: "rooms", label: "Oda sayfası", code: "Rooms", type: "Sayfa", main: true, dirty: dirtySections.rooms }],
            }] : []),
          ]}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            document.getElementById("azura-content-editor")?.scrollIntoView({ behavior: "smooth" });
          }}
          query={query}
          onQueryChange={setQuery}
          footer="Bölüm değiştirmek taslakları silmez. Ana sayfa ve oda sayfası kendi üst düğmeleriyle; genel iletişim alanı kendi düğmesiyle kaydedilir."
        />

        <div id="azura-content-editor" className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title={selectedId === "contact" ? "İletişim bilgileri" : selectedId === "rooms" ? "Oda sayfası" : "Ana sayfa"}
            code={selectedId === "contact" ? "Azura / ContactSection" : selectedId === "rooms" ? "Azura / Rooms" : "Azura / HomePage"}
            dirty={selectedId === "contact" ? dirtySections.contact : selectedId === "rooms" ? dirtySections.rooms : homepageDirty}
            locales={locales.map(([locale]) => locale)}
            localeLabels={localeLabels}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            actions={selectedId === "homepage" ? <button
              type="button"
              onClick={saveHomepage}
              disabled={!canEdit || !homepageDirty || savingHomepage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            >
              <FiSave className="h-4 w-4" />{savingHomepage ? "Kaydediliyor..." : "Ana sayfayı kaydet"}
            </button> : selectedId === "rooms" ? <button
              type="button"
              onClick={saveRooms}
              disabled={!canEdit || !dirtySections.rooms || savingRooms}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            >
              <FiSave className="h-4 w-4" />{savingRooms ? "Kaydediliyor..." : "Oda sayfasını kaydet"}
            </button> : null}
          >
            <p className="mt-3 text-xs leading-5 text-stone-500">{selectedId === "contact" ? "İletişim verisi anasayfa içeriğinden ayrı saklanır. Şimdilik anasayfadaki ContactSection bileşenini yönetir." : selectedId === "rooms" ? "Üstteki düğme banner, giriş, üç oda kartı ve parallax alanlarını dört dil için birlikte kaydeder. Lago’nun altı kartı değişmez." : "Üstteki düğme değişen alanları sırayla kaydeder ve dört dili birlikte doğrular. Azura API’leri ayrı olduğu için bu işlem tek parça değildir."}</p>
          </ContentWorkspaceToolbar>
          {selectedId === "homepage" && saveNotice ? <p role={saveNotice.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${saveNotice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{saveNotice.text}</p> : null}
          {selectedId === "rooms" && roomsNotice ? <p role={roomsNotice.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${roomsNotice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{roomsNotice.text}</p> : null}
          <div inert={savingHomepage} aria-busy={savingHomepage} className={selectedId === "homepage" ? "space-y-5" : "hidden"}>
          <section id="azura-homepage-welcome" aria-label="Karşılama" className="scroll-mt-32">
            <AzuraWelcomePage ref={welcomeRef} embedded activeLocale={activeLocale} onDirtyChange={markWelcomeDirty} />
          </section>
          <section id="azura-homepage-carousel" aria-label="Keşif kaydırıcısı" className="scroll-mt-32">
            <AzuraCarouselEditor ref={carouselRef} activeLocale={activeLocale} onDirtyChange={markCarouselDirty} />
          </section>
          <section id="azura-homepage-experience" aria-label="Tanıtım" className="scroll-mt-32">
            <AzuraExperiencePage ref={experienceRef} embedded activeLocale={activeLocale} onDirtyChange={markExperienceDirty} />
          </section>
          <section id="azura-homepage-accommodation" aria-label="Oda kartları" className="scroll-mt-32">
            <AzuraAccommodationEditor ref={accommodationRef} activeLocale={activeLocale} onDirtyChange={markAccommodationDirty} />
          </section>
          <section id="azura-homepage-essentials" aria-label="Olanaklar" className="scroll-mt-32">
            <AzuraHomepageSectionEditor ref={essentialsRef} sectionKey="essentials" activeLocale={activeLocale} onDirtyChange={markEssentialsDirty} />
          </section>
          <section id="azura-homepage-background" aria-label="Arka planlı tanıtım" className="scroll-mt-32">
            <AzuraBackgroundEditor ref={backgroundRef} activeLocale={activeLocale} onDirtyChange={markBackgroundDirty} />
          </section>
          </div>
          <section aria-label="Azura oda sayfası" inert={savingRooms} aria-busy={savingRooms} className={selectedId === "rooms" ? "" : "hidden"}>
            <AzuraRoomsEditor ref={roomsRef} activeLocale={activeLocale} onDirtyChange={markRoomsDirty} />
          </section>
          <section aria-label="Genel iletişim bilgileri" className={selectedId === "contact" ? "" : "hidden"}>
            <AzuraContactDetailsEditor activeLocale={activeLocale} onDirtyChange={markContactDirty} />
          </section>
        </div>
      </div>
    </div>
  );
}
