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
import AzuraRestaurantsEditor from "./AzuraRestaurantsEditor";
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
  const restaurantsRef = useRef(null);
  const [selectedId, setSelectedId] = useState("homepage");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);
  const [savingRestaurants, setSavingRestaurants] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [roomsNotice, setRoomsNotice] = useState(null);
  const [restaurantsNotice, setRestaurantsNotice] = useState(null);
  const [dirtySections, setDirtySections] = useState({ welcome: false, carousel: false, experience: false, accommodation: false, essentials: false, background: false, contact: false, rooms: false, restaurants: false });
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
  const markRestaurantsDirty = useCallback((dirty) => {
    if (dirty) setRestaurantsNotice(null);
    setDirtySections((current) => current.restaurants === dirty ? current : { ...current, restaurants: dirty });
  }, []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;
  const homepageDirty = Object.entries(dirtySections).some(([key, dirty]) => !["contact", "rooms", "restaurants"].includes(key) && dirty);
  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const showHomepage = "ana sayfa anasayfa homepage".includes(normalizedQuery);
  const showContact = "genel alanlar iletişim iletişim bilgileri contact".includes(normalizedQuery);
  const showRooms = "odalar oda sayfası accommodation rooms".includes(normalizedQuery);
  const showRestaurants = "restoranlar restoran sayfası restaurants".includes(normalizedQuery);

  async function saveRestaurants() {
    if (!canEdit || !dirtySections.restaurants || savingRestaurants) return;
    setSavingRestaurants(true);
    setRestaurantsNotice(null);
    try {
      const result = await restaurantsRef.current?.save() ?? "failed";
      if (result === "saved") {
        setRestaurantsNotice({ kind: "success", text: "Azura restoran sayfası kaydedildi. Değişiklikleri Azura sitesinde kontrol edin." });
      } else if (result === "failed") {
        setRestaurantsNotice({ kind: "error", text: "Restoran sayfası kaydedilemedi. Aşağıdaki hata mesajını kontrol edin." });
      }
    } finally {
      setSavingRestaurants(false);
    }
  }

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
        description="Azura anasayfasını, oda ve restoran sayfalarını ve ortak iletişim bilgilerini dört dilde düzenleyin. Lago içerikleri değişmez."
        count={4}
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
            ...(showRestaurants ? [{
              id: "restaurants",
              label: "Yeme & içme",
              items: [{ id: "restaurants", label: "Restoranlar", code: "Restaurants", type: "Sayfa", main: true, dirty: dirtySections.restaurants }],
            }] : []),
          ]}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            document.getElementById("azura-content-editor")?.scrollIntoView({ behavior: "smooth" });
          }}
          query={query}
          onQueryChange={setQuery}
          footer="Bölüm değiştirmek taslakları silmez. Ana sayfa, oda ve restoran sayfaları kendi üst düğmeleriyle; genel iletişim alanı kendi düğmesiyle kaydedilir."
        />

        <div id="azura-content-editor" className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title={selectedId === "contact" ? "İletişim bilgileri" : selectedId === "rooms" ? "Oda sayfası" : selectedId === "restaurants" ? "Restoranlar" : "Ana sayfa"}
            code={selectedId === "contact" ? "Azura / ContactSection" : selectedId === "rooms" ? "Azura / Rooms" : selectedId === "restaurants" ? "Azura / Restaurants" : "Azura / HomePage"}
            dirty={selectedId === "contact" ? dirtySections.contact : selectedId === "rooms" ? dirtySections.rooms : selectedId === "restaurants" ? dirtySections.restaurants : homepageDirty}
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
            </button> : selectedId === "restaurants" ? <button
              type="button"
              onClick={saveRestaurants}
              disabled={!canEdit || !dirtySections.restaurants || savingRestaurants}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
            >
              <FiSave className="h-4 w-4" />{savingRestaurants ? "Kaydediliyor..." : "Restoranları kaydet"}
            </button> : null}
          >
            <p className="mt-3 text-xs leading-5 text-stone-500">{selectedId === "contact" ? "İletişim verisi anasayfa içeriğinden ayrı saklanır. Şimdilik anasayfadaki ContactSection bileşenini yönetir." : selectedId === "rooms" ? "Üstteki düğme banner, giriş, üç oda kartı ve parallax alanlarını dört dil için birlikte kaydeder. Lago’nun altı kartı değişmez." : selectedId === "restaurants" ? "Üstteki düğme restoran sayfasının dört dildeki metinlerini ve 13 görselini birlikte kaydeder. Lago içerikleri değişmez." : "Üstteki düğme değişen alanları sırayla kaydeder ve dört dili birlikte doğrular. Azura API’leri ayrı olduğu için bu işlem tek parça değildir."}</p>
          </ContentWorkspaceToolbar>
          {selectedId === "homepage" && saveNotice ? <p role={saveNotice.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${saveNotice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{saveNotice.text}</p> : null}
          {selectedId === "rooms" && roomsNotice ? <p role={roomsNotice.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${roomsNotice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{roomsNotice.text}</p> : null}
          {selectedId === "restaurants" && restaurantsNotice ? <p role={restaurantsNotice.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${restaurantsNotice.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{restaurantsNotice.text}</p> : null}
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
          <section aria-label="Azura restoran sayfası" inert={savingRestaurants} aria-busy={savingRestaurants} className={selectedId === "restaurants" ? "" : "hidden"}>
            <AzuraRestaurantsEditor ref={restaurantsRef} activeLocale={activeLocale} onDirtyChange={markRestaurantsDirty} />
          </section>
          <section aria-label="Genel iletişim bilgileri" className={selectedId === "contact" ? "" : "hidden"}>
            <AzuraContactDetailsEditor activeLocale={activeLocale} onDirtyChange={markContactDirty} />
          </section>
        </div>
      </div>
    </div>
  );
}
