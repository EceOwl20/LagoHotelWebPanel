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
import AzuraAboutEditor from "./AzuraAboutEditor";
import AzuraPageContentEditor from "./AzuraPageContentEditor";
import AzuraRoomDetailEditor from "./AzuraRoomDetailEditor";
import { AZURA_ROOM_DETAIL_CONFIGS, azuraRoomDetailConfig } from "@/lib/admin/room-detail-model.mjs";
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
  const aboutRef = useRef(null);
  const spaRef = useRef(null);
  const sporRef = useRef(null);
  const barsRef = useRef(null);
  const [savingBars, setSavingBars] = useState(false);
  const kidsRef = useRef(null);
  const [savingKids, setSavingKids] = useState(false);
  const beachRef = useRef(null);
  const [savingBeach, setSavingBeach] = useState(false);
  const [savingSpor, setSavingSpor] = useState(false);
  const roomDetailRefs = useRef({});
  const [savingRoomDetail, setSavingRoomDetail] = useState(false);
  const [savingSpa, setSavingSpa] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [selectedId, setSelectedId] = useState("homepage");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [savingRooms, setSavingRooms] = useState(false);
  const [savingRestaurants, setSavingRestaurants] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null);
  const [roomsNotice, setRoomsNotice] = useState(null);
  const [restaurantsNotice, setRestaurantsNotice] = useState(null);
  const [dirtySections, setDirtySections] = useState({ welcome: false, carousel: false, experience: false, accommodation: false, essentials: false, background: false, contact: false, rooms: false, restaurants: false, about: false, spa: false, spor: false, beachpools: false, kidsclub: false, bars: false, ...Object.fromEntries(Object.keys(AZURA_ROOM_DETAIL_CONFIGS).map((key) => [key, false])) });
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
  const markAboutDirty = useCallback((dirty) => setDirtySections((current) =>
    current.about === dirty ? current : { ...current, about: dirty }), []);
  const markSpaDirty = useCallback((dirty) => setDirtySections((current) =>
    current.spa === dirty ? current : { ...current, spa: dirty }), []);
  const markRoomDetailDirty = useCallback((roomKey, dirty) => setDirtySections((current) =>
    current[roomKey] === dirty ? current : { ...current, [roomKey]: dirty }), []);
  const selectedRoom = azuraRoomDetailConfig(selectedId);
  const markSporDirty = useCallback((dirty) => setDirtySections((current) =>
    current.spor === dirty ? current : { ...current, spor: dirty }), []);
  const markBeachDirty = useCallback((dirty) => setDirtySections((current) =>
    current.beachpools === dirty ? current : { ...current, beachpools: dirty }), []);
  const markKidsDirty = useCallback((dirty) => setDirtySections((current) =>
    current.kidsclub === dirty ? current : { ...current, kidsclub: dirty }), []);
  const markBarsDirty = useCallback((dirty) => setDirtySections((current) =>
    current.bars === dirty ? current : { ...current, bars: dirty }), []);
  const dirtyCount = Object.values(dirtySections).filter(Boolean).length;
  const homepageDirty = Object.entries(dirtySections).some(([key, dirty]) => !["contact", "rooms", "restaurants", "about", "spa", "spor", "beachpools", "kidsclub", "bars", ...Object.keys(AZURA_ROOM_DETAIL_CONFIGS)].includes(key) && dirty);
  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const showHomepage = "ana sayfa anasayfa homepage".includes(normalizedQuery);
  const showContact = "genel alanlar iletişim iletişim bilgileri contact".includes(normalizedQuery);
  const showRooms = "odalar oda sayfası accommodation rooms".includes(normalizedQuery);
  const showRestaurants = "restoranlar restoran sayfası restaurants".includes(normalizedQuery);

  async function saveBars() {
    if (!canEdit || !dirtySections.bars || savingBars) return;
    setSavingBars(true);
    try { await barsRef.current?.save(); }
    finally { setSavingBars(false); }
  }

  async function saveKids() {
    if (!canEdit || !dirtySections.kidsclub || savingKids) return;
    setSavingKids(true);
    try { await kidsRef.current?.save(); }
    finally { setSavingKids(false); }
  }

  async function saveBeach() {
    if (!canEdit || !dirtySections.beachpools || savingBeach) return;
    setSavingBeach(true);
    try { await beachRef.current?.save(); }
    finally { setSavingBeach(false); }
  }

  const showAbout = "hakkımızda hakkimizda about".includes(normalizedQuery);

  const showSpa = "spa wellness sağlık sağlıklı yaşam".includes(normalizedQuery);

  const visibleRooms = Object.values(AZURA_ROOM_DETAIL_CONFIGS).filter((room) =>
    `odalar oda detay ${room.label} ${room.roomKey} ${room.pageKey}`.toLocaleLowerCase("tr").includes(normalizedQuery));

  async function saveRoomDetail() {
    if (!canEdit || !selectedRoom || !dirtySections[selectedId] || savingRoomDetail) return;
    setSavingRoomDetail(true);
    try { await roomDetailRefs.current[selectedId]?.save(); }
    finally { setSavingRoomDetail(false); }
  }

  async function saveSpor() {
    if (!canEdit || !dirtySections.spor || savingSpor) return;
    setSavingSpor(true);
    try { await sporRef.current?.save(); }
    finally { setSavingSpor(false); }
  }

  async function saveSpa() {
    if (!canEdit || !dirtySections.spa || savingSpa) return;
    setSavingSpa(true);
    try { await spaRef.current?.save(); }
    finally { setSavingSpa(false); }
  }

  async function saveAbout() {
    if (!canEdit || !dirtySections.about || savingAbout) return;
    setSavingAbout(true);
    try { await aboutRef.current?.save(); }
    finally { setSavingAbout(false); }
  }

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
        description="Azura anasayfasını, oda, restoran/kafe, bar, Hakkımızda, Spa, Spor, Çocuk Kulübü ve Plaj/Havuz sayfalarını ve ortak iletişim bilgilerini dört dilde düzenleyin. Lago içerikleri değişmez."
        count={10 + Object.keys(AZURA_ROOM_DETAIL_CONFIGS).length}
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
            ...("barlar bars".includes(normalizedQuery) ? [{
              id: "bars", label: "Barlar",
              items: [{ id: "bars", label: "Barlar", code: "Bars", type: "Sayfa", main: true, dirty: dirtySections.bars }],
            }] : []),
            ...("çocuk kulübü kids club kidsclub".includes(normalizedQuery) ? [{
              id: "kids", label: "Çocuk Kulübü",
              items: [{ id: "kidsclub", label: "Çocuk Kulübü", code: "KidsClub", type: "Sayfa", main: true, dirty: dirtySections.kidsclub }],
            }] : []),
            ...("plaj havuzlar beach pools beachpools".includes(normalizedQuery) ? [{
              id: "beach", label: "Plaj ve Havuzlar",
              items: [{ id: "beachpools", label: "Plaj ve Havuzlar", code: "BeachPools", type: "Sayfa", main: true, dirty: dirtySections.beachpools }],
            }] : []),
            ...(showHomepage ? [{
              id: "home",
              label: "Ana sayfa",
              items: [{ id: "homepage", label: "Ana sayfa", code: "HomePage", type: "Sayfa", main: true, dirty: homepageDirty }],
            }] : []),
            ...((showRooms || visibleRooms.length > 0) ? [{
              id: "rooms",
              label: "Odalar",
              items: [
                ...(showRooms ? [{ id: "rooms", label: "Oda sayfası", code: "Rooms", type: "Sayfa", main: true, dirty: dirtySections.rooms }] : []),
                ...visibleRooms.map((room) => ({ id: room.roomKey, label: room.label, code: room.pageKey, type: "Oda detayı", dirty: dirtySections[room.roomKey] })),
              ],
            }] : []),
            ...("spor sport fitness".includes(normalizedQuery) ? [{
              id: "sport", label: "Spor",
              items: [{ id: "spor", label: "Spor", code: "Sport", type: "Sayfa", main: true, dirty: dirtySections.spor }],
            }] : []),
            ...(showSpa ? [{
              id: "pages", label: "Spa & Wellness",
              items: [{ id: "spa", label: "Spa & Wellness", code: "Spa", type: "Sayfa", main: true, dirty: dirtySections.spa }],
            }] : []),
            ...(showAbout ? [{
              id: "about", label: "Otel hakkında",
              items: [{ id: "about", label: "Hakkımızda", code: "About", type: "Sayfa", main: true, dirty: dirtySections.about }],
            }] : []),
            ...(showRestaurants ? [{
              id: "food",
              label: "Yeme & içme",
              items: [{ id: "restaurants", label: "Restoranlar ve Kafeler", code: "Restaurants", type: "Sayfa", main: true, dirty: dirtySections.restaurants }],
            }] : []),
          ]}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            document.getElementById("azura-content-editor")?.scrollIntoView({ behavior: "smooth" });
          }}
          query={query}
          onQueryChange={setQuery}
          footer="Bölüm değiştirmek taslakları silmez. Sayfalar kendi üst düğmeleriyle; genel iletişim alanı kendi düğmesiyle kaydedilir."
        />

        <div id="azura-content-editor" className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title={selectedId === "bars" ? "Barlar" : selectedId === "kidsclub" ? "Çocuk Kulübü" : selectedId === "beachpools" ? "Plaj ve Havuzlar" : selectedId === "spor" ? "Spor" : selectedRoom ? selectedRoom.label : selectedId === "spa" ? "Spa & Wellness" : selectedId === "about" ? "Hakkımızda" : selectedId === "contact" ? "İletişim bilgileri" : selectedId === "rooms" ? "Oda sayfası" : selectedId === "restaurants" ? "Restoranlar ve Kafeler" : "Ana sayfa"}
            code={selectedId === "bars" ? "Azura / Bars" : selectedId === "kidsclub" ? "Azura / KidsClub" : selectedId === "beachpools" ? "Azura / BeachPools" : selectedId === "spor" ? "Azura / Spor" : selectedRoom ? `Azura / ${selectedRoom.pageKey}` : selectedId === "spa" ? "Azura / Spa" : selectedId === "about" ? "Azura / About" : selectedId === "contact" ? "Azura / ContactSection" : selectedId === "rooms" ? "Azura / Rooms" : selectedId === "restaurants" ? "Azura / Restaurants" : "Azura / HomePage"}
            dirty={selectedId === "bars" ? dirtySections.bars : selectedId === "kidsclub" ? dirtySections.kidsclub : selectedId === "beachpools" ? dirtySections.beachpools : selectedId === "spor" ? dirtySections.spor : selectedRoom ? dirtySections[selectedId] : selectedId === "spa" ? dirtySections.spa : selectedId === "about" ? dirtySections.about : selectedId === "contact" ? dirtySections.contact : selectedId === "rooms" ? dirtySections.rooms : selectedId === "restaurants" ? dirtySections.restaurants : homepageDirty}
            locales={locales.map(([locale]) => locale)}
            localeLabels={localeLabels}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            actions={selectedId === "bars" ? <button type="button" onClick={saveBars}
              disabled={!canEdit || !dirtySections.bars || savingBars}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingBars ? "Kaydediliyor..." : "Barları kaydet"}
            </button> : selectedId === "kidsclub" ? <button type="button" onClick={saveKids}
              disabled={!canEdit || !dirtySections.kidsclub || savingKids}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingKids ? "Kaydediliyor..." : "Çocuk kulübünü kaydet"}
            </button> : selectedId === "beachpools" ? <button type="button" onClick={saveBeach}
              disabled={!canEdit || !dirtySections.beachpools || savingBeach}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingBeach ? "Kaydediliyor..." : "Plaj ve havuzları kaydet"}
            </button> : selectedId === "spor" ? <button type="button" onClick={saveSpor}
              disabled={!canEdit || !dirtySections.spor || savingSpor}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingSpor ? "Kaydediliyor..." : "Spor sayfasını kaydet"}
            </button> : selectedRoom ? <button type="button" onClick={saveRoomDetail}
              disabled={!canEdit || !dirtySections[selectedId] || savingRoomDetail}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingRoomDetail ? "Kaydediliyor..." : "Odayı kaydet"}
            </button> : selectedId === "spa" ? <button type="button" onClick={saveSpa}
              disabled={!canEdit || !dirtySections.spa || savingSpa}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingSpa ? "Kaydediliyor..." : "Spa sayfasını kaydet"}
            </button> : selectedId === "about" ? <button type="button" onClick={saveAbout}
              disabled={!canEdit || !dirtySections.about || savingAbout}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
              <FiSave className="h-4 w-4" />{savingAbout ? "Kaydediliyor..." : "Hakkımızda sayfasını kaydet"}
            </button> : selectedId === "homepage" ? <button
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
            <p className="mt-3 text-xs leading-5 text-stone-500">{selectedId === "bars" ? "Üstteki düğme dört dilin metinlerini ve dokuz görsel alanını birlikte kaydeder." : selectedId === "kidsclub" ? "Üstteki düğme dört dilin metinlerini ve 14 görsel alanını birlikte kaydeder." : selectedId === "beachpools" ? "Üstteki düğme dört dilin metinlerini ve 17 görsel alanını birlikte kaydeder. Video dosyası değişmez." : selectedId === "spor" ? "Üstteki düğme dört dildeki Spor metinlerini ve sekiz görsel alanını birlikte kaydeder." : selectedRoom ? `Üstteki düğme dört dildeki oda metinlerini, görselleri ve ${selectedRoom.tourIds.length} sanal turu birlikte kaydeder.` : selectedId === "spa" ? "Üstteki düğme dört dildeki metinleri ve 14 görsel alanını birlikte kaydeder." : selectedId === "about" ? "Üstteki düğme dört dildeki metinleri ve sekiz görseli birlikte kaydeder." : selectedId === "contact" ? "İletişim verisi anasayfa içeriğinden ayrı saklanır. Şimdilik anasayfadaki ContactSection bileşenini yönetir." : selectedId === "rooms" ? "Üstteki düğme banner, giriş, üç oda kartı ve parallax alanlarını dört dil için birlikte kaydeder. Lago’nun altı kartı değişmez." : selectedId === "restaurants" ? "Üstteki düğme restoran sayfasının dört dildeki metinlerini ve 13 görselini birlikte kaydeder. Lago içerikleri değişmez." : "Üstteki düğme değişen alanları sırayla kaydeder ve dört dili birlikte doğrular. Azura API’leri ayrı olduğu için bu işlem tek parça değildir."}</p>
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
          <section aria-label="Azura Hakkımızda sayfası" inert={savingAbout} aria-busy={savingAbout} className={selectedId === "about" ? "" : "hidden"}>
            <AzuraAboutEditor ref={aboutRef} activeLocale={activeLocale} onDirtyChange={markAboutDirty} />
          </section>
          <section aria-label="Azura Spor sayfası" inert={savingSpor} aria-busy={savingSpor} className={selectedId === "spor" ? "" : "hidden"}>
            <AzuraPageContentEditor pageKey="spor" ref={sporRef} activeLocale={activeLocale} onDirtyChange={markSporDirty} />
          </section>
          <section aria-label="Azura Barlar sayfası" inert={savingBars} aria-busy={savingBars} className={selectedId === "bars" ? "" : "hidden"}>
            <AzuraPageContentEditor pageKey="bars" ref={barsRef} activeLocale={activeLocale} onDirtyChange={markBarsDirty} />
          </section>
          <section aria-label="Azura Çocuk Kulübü sayfası" inert={savingKids} aria-busy={savingKids} className={selectedId === "kidsclub" ? "" : "hidden"}>
            <AzuraPageContentEditor pageKey="kidsclub" ref={kidsRef} activeLocale={activeLocale} onDirtyChange={markKidsDirty} />
          </section>
          <section aria-label="Azura Plaj ve Havuzlar sayfası" inert={savingBeach} aria-busy={savingBeach} className={selectedId === "beachpools" ? "" : "hidden"}>
            <AzuraPageContentEditor pageKey="beachpools" ref={beachRef} activeLocale={activeLocale} onDirtyChange={markBeachDirty} />
          </section>
          <section aria-label="Azura Spa sayfası" inert={savingSpa} aria-busy={savingSpa} className={selectedId === "spa" ? "" : "hidden"}>
            <AzuraPageContentEditor ref={spaRef} activeLocale={activeLocale} onDirtyChange={markSpaDirty} />
          </section>
          {Object.values(AZURA_ROOM_DETAIL_CONFIGS).map((room) => (
            <section key={room.roomKey} aria-label={`Azura ${room.label} detayı`} inert={savingRoomDetail} aria-busy={savingRoomDetail} className={selectedId === room.roomKey ? "" : "hidden"}>
              <AzuraRoomDetailEditor roomKey={room.roomKey} ref={(editor) => { roomDetailRefs.current[room.roomKey] = editor; }} activeLocale={activeLocale}
                onDirtyChange={(dirty) => markRoomDetailDirty(room.roomKey, dirty)} />
            </section>
          ))}
          <section aria-label="Genel iletişim bilgileri" className={selectedId === "contact" ? "" : "hidden"}>
            <AzuraContactDetailsEditor activeLocale={activeLocale} onDirtyChange={markContactDirty} />
          </section>
        </div>
      </div>
    </div>
  );
}
