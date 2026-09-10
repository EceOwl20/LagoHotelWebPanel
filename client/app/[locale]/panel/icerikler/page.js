"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiCoffee,
  FiCompass,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiHome,
  FiLayers,
  FiSave,
  FiSearch,
  FiSettings,
  FiX,
} from "react-icons/fi";
import ObjectEditor from "../components/ObjectEditor";
import { CMS_LOCALES } from "@/lib/admin/constants";
import dynamic from "next/dynamic";
import { RESTAURANT_DETAIL_CONFIGS } from "@/lib/admin/restaurant-detail-config.mjs";

function getNamespaceLabel(namespace) {
  if (namespaceLabels[namespace]) {
    return namespaceLabels[namespace];
  }

  return namespace.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}


const namespaceLabels = {
  LocaleSwitcher: "Dil seçici",
  Header: "Site üst menüsü",
  Reservation: "Rezervasyon alanı",
  HomePage: "Ana sayfa",
  ContactSection: "İletişim alanı",
  ContactSection2: "İletişim alanı 2",
  Footer: "Site alt bilgisi",
  Accommodation: "Odalar ana sayfası",
  RoomsParallax: "Odalar özellik alanı",
  Restaurants: "Restoranlar ana sayfası",
  ...Object.fromEntries(
    RESTAURANT_DETAIL_CONFIGS.map((config) => [config.namespace, config.fieldLabel])
  ),
  BarAndCafes: "Bar ve kafeler ana sayfası",
  BeachPools: "Plaj ve havuzlar",
  Spa: "Spa & Wellness",
  DisabledRoom: "Engelli odası",
  SuperiorRoom: "Superior oda",
  FamilyRoom: "Aile odası",
  SwimupRoom: "Swim Up oda",
  FamilySwimupRoom: "Aile Swim Up oda",
  DuplexFamilyRoom: "Dubleks aile odası",
  TinyVilla: "Tiny Villa",
  Fitness: "Fitness",
  Entertainment: "Eğlence",
  KidsClub: "Çocuk kulübü",
  Special: "Özel konsept",
  About: "Hakkımızda",
  BlogNews: "Blog ve haberler",
  Contact: "İletişim sayfası",
  Gallery: "Galeri sayfası",
  CookiePopup: "Çerez bildirimi",
  Explore: "Keşfet alanı",
  IconSection: "İkon alanı",
  Certificates: "Sertifikalar",
};

const localeLabels = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

const namespaceGroups = [
  {
    id: "general",
    label: "Genel alanlar",
    namespaces: [
      "Header",
      "Footer",
      "LocaleSwitcher",
      "Reservation",
      "ContactSection",
      "ContactSection2",
      "CookiePopup",
      "Explore",
      "IconSection",
    ],
  },
  { id: "home", label: "Ana sayfa", namespaces: ["HomePage"] },
  {
    id: "rooms",
    label: "Odalar",
    namespaces: [
      "Accommodation",
      "RoomsParallax",
      "SuperiorRoom",
      "FamilyRoom",
      "SwimupRoom",
      "FamilySwimupRoom",
      "DuplexFamilyRoom",
      "DisabledRoom",
      "TinyVilla",
    ],
  },
  {
    id: "food",
    label: "Yeme & içme",
    namespaces: [
      "Restaurants",
      "GustoRestaurants",
      "AnatoliaRestaurants",
      "DespinaRestaurants",
      "FuegoRestaurants",
      "MainRestaurants",
      "TapazRestaurants",
      "WasabiRestaurants",
      "BarAndCafes",
      "JoieBar",
      "MaldivaBar",
      "MignonBar",
      "PianoBar",
      "VagoBar",
      "Abellapatisserie",
      "Cafedehouse",
      "Cafedelago",
    ],
  },
  {
    id: "pages",
    label: "Diğer sayfalar",
    namespaces: [
      "BeachPools",
      "Spa",
      "Fitness",
      "Entertainment",
      "KidsClub",
      "Special",
      "About",
      "BlogNews",
      "Contact",
      "Gallery",
      "Certificates",
    ],
  },
];

const GROUP_VISUALS = {
  general: {
    icon: FiSettings,
    iconClass: "bg-[#edf5f3] text-[#507f78]",
    itemIconClass: "bg-[#dcece9]/80 text-[#507f78]",
    headerClass: "bg-[#edf5f3]/60",
    borderClass: "border-[#63978f]/20",
    accentClass: "bg-[#63978f]",
  },

  home: {
    icon: FiHome,
    iconClass: "bg-amber-100 text-amber-700",
    itemIconClass: "bg-amber-100/80 text-amber-700",
    headerClass: "bg-amber-50/60",
    borderClass: "border-amber-200/70",
    accentClass: "bg-amber-400",
  },

  rooms: {
    icon: FiGrid,
    iconClass: "bg-sky-100 text-sky-700",
    itemIconClass: "bg-sky-100/80 text-sky-700",
    headerClass: "bg-sky-50/60",
    borderClass: "border-sky-200/70",
    accentClass: "bg-sky-400",
  },

  food: {
    icon: FiCoffee,
    iconClass: "bg-orange-100 text-orange-700",
    itemIconClass: "bg-orange-100/80 text-orange-700",
    headerClass: "bg-orange-50/60",
    borderClass: "border-orange-200/70",
    accentClass: "bg-orange-400",
  },

  pages: {
    icon: FiCompass,
   iconClass: "bg-violet-100 text-violet-700",
    itemIconClass: "bg-violet-100/80 text-violet-700",
    headerClass: "bg-violet-50/60",
    borderClass: "border-violet-200/70",
    accentClass: "bg-violet-400",
  },

  other: {
    icon: FiLayers,
    iconClass: "bg-violet-100 text-violet-700",
    itemIconClass: "bg-violet-100/80 text-violet-700",
    headerClass: "bg-violet-50/60",
    borderClass: "border-violet-200/70",
    accentClass: "bg-violet-400",
  },
};

const BAR_CAFE_DETAIL_NAMESPACE_LIST = [
  "JoieBar",
  "MaldivaBar",
  "MignonBar",
  "PianoBar",
  "VagoBar",
  "Abellapatisserie",
  "Cafedehouse",
  "Cafedelago",
];

const MAIN_PAGE_NAMESPACES = new Set([
  "HomePage",
  "Accommodation",
  "Restaurants",
  "BarAndCafes",
]);

const ROOM_DETAIL_NAMESPACES = new Set([
  "SuperiorRoom",
  "FamilyRoom",
  "SwimupRoom",
  "FamilySwimupRoom",
  "DuplexFamilyRoom",
  "DisabledRoom",
  "TinyVilla",
]);

const RESTAURANT_DETAIL_NAMESPACES = new Set(
  RESTAURANT_DETAIL_CONFIGS.map((config) => config.namespace)
);

const BAR_CAFE_DETAIL_NAMESPACES = new Set(
  BAR_CAFE_DETAIL_NAMESPACE_LIST
);

const STANDALONE_PAGE_NAMESPACES = new Set([
  "BeachPools",
  "Spa",
  "Fitness",
  "Entertainment",
  "KidsClub",
  "Special",
  "About",
  "BlogNews",
  "Contact",
  "Gallery",
  "Certificates",
]);

function getNamespaceType(namespace) {
  if (MAIN_PAGE_NAMESPACES.has(namespace)) {
    return "Ana sayfa";
  }

  if (ROOM_DETAIL_NAMESPACES.has(namespace)) {
    return "Oda detayı";
  }

  if (RESTAURANT_DETAIL_NAMESPACES.has(namespace)) {
    return "Restoran detayı";
  }

  if (BAR_CAFE_DETAIL_NAMESPACES.has(namespace)) {
    return "Bar / kafe detayı";
  }

  if (STANDALONE_PAGE_NAMESPACES.has(namespace)) {
    return "Sayfa";
  }

  return "Ortak bölüm";
}

function isDetailNamespace(namespace) {
  return (
    ROOM_DETAIL_NAMESPACES.has(namespace) ||
    RESTAURANT_DETAIL_NAMESPACES.has(namespace) ||
    BAR_CAFE_DETAIL_NAMESPACES.has(namespace)
  );
}



function MediaEditorLoading() {
  return (
    <div className="h-40 animate-pulse rounded-2xl border border-stone-200 bg-white" />
  );
}

const dynamicEditor = (loader) =>
  dynamic(loader, {
    loading: MediaEditorLoading,
  });

const CertificateMediaEditor = dynamicEditor(
  () => import("./CertificateMediaEditor")
);

const HomePageMediaEditor = dynamicEditor(
  () => import("./HomePageMediaEditor")
);

const AboutMediaEditor = dynamicEditor(
  () => import("./AboutMediaEditor")
);

const ContactMediaEditor = dynamicEditor(
  () => import("./ContactMediaEditor")
);

const ContactSection2MediaEditor = dynamicEditor(
  () => import("./ContactSection2MediaEditor")
);

const BarCafesMediaEditor = dynamicEditor(
  () => import("./BarCafesMediaEditor")
);

const BarCafeDetailMediaEditor = dynamicEditor(
  () => import("./BarCafeDetailMediaEditor")
);

const BeachPoolsMediaEditor = dynamicEditor(
  () => import("./BeachPoolsMediaEditor")
);

const KidsClubMediaEditor = dynamicEditor(
  () => import("./KidsClubMediaEditor")
);

const EntertainmentMediaEditor = dynamicEditor(
  () => import("./EntertainmentMediaEditor")
);

const SpecialMediaEditor = dynamicEditor(
  () => import("./SpecialMediaEditor")
);

const FitnessMediaEditor = dynamicEditor(
  () => import("./FitnessMediaEditor")
);

const DisabledRoomMediaEditor = dynamicEditor(
  () => import("./DisabledRoomMediaEditor")
);

const DuplexFamilyRoomMediaEditor = dynamicEditor(
  () => import("./DuplexFamilyRoomMediaEditor")
);

const FamilyRoomMediaEditor = dynamicEditor(
  () => import("./FamilyRoomMediaEditor")
);

const FamilySwimupRoomMediaEditor = dynamicEditor(
  () => import("./FamilySwimupRoomMediaEditor")
);

const RestaurantsMediaEditor = dynamicEditor(
  () => import("./RestaurantsMediaEditor")
);

const SharedRoomMediaEditor = dynamicEditor(
  () => import("./SharedRoomMediaEditor")
);

const SuperiorRoomMediaEditor = dynamicEditor(
  () => import("./SuperiorRoomMediaEditor")
);

const SwimupRoomMediaEditor = dynamicEditor(
  () => import("./SwimupRoomMediaEditor")
);

const TinyVillaMediaEditor = dynamicEditor(
  () => import("./TinyVillaMediaEditor")
);

const SpaWellnessMediaEditor = dynamicEditor(
  () => import("./SpaWellnessMediaEditor")
);

const RoomsMediaEditor = dynamicEditor(
  () => import("./RoomsMediaEditor")
);

const RestaurantDetailMediaEditor = dynamicEditor(
  () => import("./RestaurantDetailMediaEditor")
);



function groupNamespaces(namespaces, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const knownNamespaces = new Set(namespaceGroups.flatMap((group) => group.namespaces));
  const groups = [
    ...namespaceGroups,
    {
      id: "other",
      label: "Diğer içerikler",
      namespaces: namespaces.filter((namespace) => !knownNamespaces.has(namespace)),
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      namespaces: group.namespaces.filter((namespace) => {
        if (!namespaces.includes(namespace)) return false;
        if (!normalizedQuery) return true;

        return `${getNamespaceLabel(namespace)} ${namespace}`
          .toLocaleLowerCase("tr")
          .includes(normalizedQuery);
      }),
    }))
    .filter((group) => group.namespaces.length > 0);
}

const RESTAURANT_DETAIL_EDITOR_ENTRIES = Object.fromEntries(
  RESTAURANT_DETAIL_CONFIGS.map((config) => [
    config.namespace,
    RestaurantDetailMediaEditor,
  ])
);


const BAR_CAFE_DETAIL_EDITOR_ENTRIES = Object.fromEntries(
  BAR_CAFE_DETAIL_NAMESPACE_LIST.map((namespace) => [
    namespace,
    BarCafeDetailMediaEditor,
  ])
);

const MEDIA_EDITOR_REGISTRY = {
  HomePage: HomePageMediaEditor,
  About: AboutMediaEditor,
  Contact: ContactMediaEditor,
  ContactSection2: ContactSection2MediaEditor,
  Certificates: CertificateMediaEditor,
  Spa: SpaWellnessMediaEditor,
  Accommodation: RoomsMediaEditor,
  Restaurants: RestaurantsMediaEditor,
  BarAndCafes: BarCafesMediaEditor,
  BeachPools: BeachPoolsMediaEditor,
  KidsClub: KidsClubMediaEditor,
  Entertainment: EntertainmentMediaEditor,
  Special: SpecialMediaEditor,
  Fitness: FitnessMediaEditor,
  RoomsParallax: SharedRoomMediaEditor,
  SuperiorRoom: SuperiorRoomMediaEditor,
  FamilyRoom: FamilyRoomMediaEditor,
  SwimupRoom: SwimupRoomMediaEditor,
  FamilySwimupRoom: FamilySwimupRoomMediaEditor,
  DuplexFamilyRoom: DuplexFamilyRoomMediaEditor,
  DisabledRoom: DisabledRoomMediaEditor,
  TinyVilla: TinyVillaMediaEditor,

  ...RESTAURANT_DETAIL_EDITOR_ENTRIES,
  ...BAR_CAFE_DETAIL_EDITOR_ENTRIES,
};

export default function PanelContentPage() {
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [bundle, setBundle] = useState(null);
  const [activeLocale, setActiveLocale] = useState("tr");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBundle, setLoadingBundle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); //değişiklik yapıldı mı?
  const [pendingNamespace, setPendingNamespace] = useState(""); //pendingNamespace
  const [showUnsavedModal, setShowUnsavedModal] = useState(false); //showUnsavedModal

  const [messageType, setMessageType] = useState("success");

  const editVersionRef = useRef(0);

  useEffect(() => {
    const loadNamespaces = async () => {
      try {
        const response = await fetch("/api/admin/messages/namespaces", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "İçerik listesi alınamadı.");
        }

        setNamespaces(payload.namespaces);
        setSelectedNamespace(payload.namespaces[0] || "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadNamespaces();
  }, []);

useEffect(() => {
  if (!selectedNamespace) return;

  const controller = new AbortController();

  const loadBundle = async () => {
    setLoadingBundle(true);
    setBundle(null);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/messages/namespace?namespace=${encodeURIComponent(
          selectedNamespace
        )}`,
        {
          cache: "no-store",
          signal: controller.signal,
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "İçerik alınamadı.");
      }

      setBundle(payload.bundle);
    } catch (loadError) {
      if (
        loadError instanceof Error &&
        loadError.name === "AbortError"
      ) {
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : "İçerik alınamadı."
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoadingBundle(false);
      }
    }
  };

  loadBundle();

  return () => {
    controller.abort();
  };
}, [selectedNamespace]);

  useEffect(() => {
  const handleBeforeUnload = (event) => {
    if (!hasUnsavedChanges) return;

    event.preventDefault();
    event.returnValue = "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [hasUnsavedChanges]);

  const activeValue = bundle?.[activeLocale] ?? {};
  
const visibleGroups = useMemo(
  () => groupNamespaces(namespaces, query),
  [namespaces, query]
);

const updateActiveLocaleValue = (updater) => {
  editVersionRef.current += 1;

  setBundle((currentBundle) => ({
    ...currentBundle,
    [activeLocale]:
      typeof updater === "function"
        ? updater(currentBundle?.[activeLocale] || {})
        : updater,
  }));

  setHasUnsavedChanges(true);
  setMessage("");
  setError("");
};


//Sayfa seçimini ayrı fonksiyondan yönet
const handleNamespaceSelect = (nextNamespace) => {
  if (saving || nextNamespace === selectedNamespace) {
    return;
  }

  if (hasUnsavedChanges) {
    setPendingNamespace(nextNamespace);
    setShowUnsavedModal(true);
    return;
  }

  setSelectedNamespace(nextNamespace);
};

const handleSave = async () => {
  if (saving || !selectedNamespace || !bundle) {
    return false;
  }

  const namespaceBeingSaved = selectedNamespace;
  const bundleBeingSaved = bundle;
  const editVersionBeingSaved = editVersionRef.current;

  setSaving(true);
setError("");
setMessage("");
setMessageType("success");

  try {
    const response = await fetch("/api/admin/messages/namespace", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        namespace: namespaceBeingSaved,
        bundle: bundleBeingSaved,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "İçerik kaydedilemedi.");
    }

    const hasNewChanges =
      editVersionRef.current !== editVersionBeingSaved;

    if (hasNewChanges) {
      setHasUnsavedChanges(true);
      setMessageType("warning");
      setMessage(
        "İlk değişiklikler kaydedildi. Kayıt sırasında yaptığınız yeni değişiklikler henüz kaydedilmedi."
      );

      return false;
    }

    setBundle(payload.bundle);
    setHasUnsavedChanges(false);
    setMessageType("success");
    setMessage("Tüm diller başarıyla kaydedildi.");

    return true;
  } catch (saveError) {
    setError(
      saveError instanceof Error
        ? saveError.message
        : "İçerik kaydedilemedi."
    );

    return false;
  } finally {
    setSaving(false);
  }
};

const handleSaveAndContinue = async () => {
  const nextNamespace = pendingNamespace;
  const savedSuccessfully = await handleSave();

  if (!savedSuccessfully) {
    return;
  }

  setShowUnsavedModal(false);
  setPendingNamespace("");
  setSelectedNamespace(nextNamespace);
};

//Kaydetmeden devam et
const handleDiscardAndContinue = () => {
  const nextNamespace = pendingNamespace;

  setShowUnsavedModal(false);
  setPendingNamespace("");
  setHasUnsavedChanges(false);
  setMessage("");
  setError("");
  setSelectedNamespace(nextNamespace);
};

//Popup’ı kapatma
const handleCloseUnsavedModal = () => {
  if (saving) return;

  setShowUnsavedModal(false);
  setPendingNamespace("");
};


const SelectedMediaEditor =
  MEDIA_EDITOR_REGISTRY[selectedNamespace] || null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-lagoBlack px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">
              İçerik yönetimi / Sayfa içerikleri
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              İçerik düzenleyici
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">
              Sayfaların metinlerini ve medya alanlarını dört dilde, tek bir çalışma
              alanından güvenle yönetin.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <FiLayers className="h-4 w-4 text-[#a9c9c4]" />
              {loading ? "Yükleniyor" : `${namespaces.length} içerik grubu`}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <FiGlobe className="h-4 w-4 text-[#a9c9c4]" />
              4 dil
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

      <div className="grid items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-20">
          <div className="border-b border-stone-200 bg-stone-50/70 px-5 pt-5 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63978f]">
                  İçerik navigasyonu
                </p>
                <p className="mt-1.5 font-semibold text-stone-900">Sayfa veya bölüm seçin</p>
              </div>
              <span className="rounded-xl bg-[#edf5f3] p-2.5 text-[#507f78]">
                <FiFileText className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <label className="relative mt-3 block">
              <span className="sr-only">Sayfalarda ara</span>
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Sayfa veya bölüm ara..."
                className="w-full rounded-xl border border-stone-200 bg-white py-1.5 pl-10 pr-9 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Aramayı temizle"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>
          </div>

          <div className="max-h-[calc(100vh-12rem)] space-y-3 overflow-y-auto p-3">
            {loading ? (
              <div className="space-y-2 p-1">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-12 animate-pulse rounded-xl bg-stone-100" />
                ))}
              </div>
            ) : visibleGroups.length > 0 ? (
             visibleGroups.map((group) => {
  const visual =
    GROUP_VISUALS[group.id] || GROUP_VISUALS.other;

  const GroupIcon = visual.icon;

  return (
    <section
      key={group.id}
      className={`overflow-hidden rounded-2xl border bg-white ${visual.borderClass}`}
    >
      {/* Grup başlığı */}
      <div
        className={`relative flex items-center gap-3 border-b px-3 py-3 ${visual.headerClass} ${visual.borderClass}`}
      >
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-0 top-0 w-1 ${visual.accentClass}`}
        />

        <span
          className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${visual.iconClass}`}
        >
          <GroupIcon className="h-4 w-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-stone-700">
            {group.label}
          </p>

          <p className="mt-0.5 text-[10px] text-stone-400">
            {group.namespaces.length} içerik
          </p>
        </div>
      </div>

      {/* Grup sayfaları */}
      <div className="divide-y divide-stone-100">
        {group.namespaces.map((namespace) => {
          const isSelected =
            selectedNamespace === namespace;

          const isDetail =
            isDetailNamespace(namespace);

          const namespaceType =
            getNamespaceType(namespace);

          return (
            <button
              key={namespace}
              type="button"
              onClick={() =>
                handleNamespaceSelect(namespace)
              }
              aria-current={isSelected ? "page" : undefined}
              className={`group relative flex w-full items-center gap-3 py-3 pr-3 text-left transition ${
                isDetail ? "pl-6" : "pl-3"
              } ${
                isSelected
                  ? "bg-[#2f423f] text-white"
                  : MAIN_PAGE_NAMESPACES.has(namespace)
                    ? "bg-stone-50/70 text-stone-800 hover:bg-[#edf5f3]"
                    : "bg-white text-stone-700 hover:bg-[#edf5f3]/70"
              }`}
            >
              {/* Detay sayfası hiyerarşi çizgisi */}
              {isDetail && !isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-[17px] top-0 w-px bg-stone-200"
                />
              ) : null}

              {/* Seçili sayfa çizgisi */}
              {isSelected ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#8bc3ba]"
                />
              ) : null}

              <span
  className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition duration-200 ${
    isSelected
      ? "bg-white/10 text-white"
      : `${visual.itemIconClass} ${
          MAIN_PAGE_NAMESPACES.has(namespace)
            ? "shadow-sm ring-1 ring-black/5"
            : ""
        }`
  }`}
>
  {isSelected ? (
    <FiCheck
      className="h-4 w-4"
      aria-hidden="true"
    />
  ) : MAIN_PAGE_NAMESPACES.has(namespace) ? (
    <FiHome
      className="h-4 w-4"
      aria-hidden="true"
    />
  ) : (
    <FiFileText
      className="h-3.5 w-3.5"
      aria-hidden="true"
    />
  )}
</span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm ${
                    MAIN_PAGE_NAMESPACES.has(namespace)
                      ? "font-semibold"
                      : "font-medium"
                  }`}
                >
                  {getNamespaceLabel(namespace)}
                </span>

                <span className="mt-1 flex min-w-0 items-center gap-1.5">
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      isSelected
                        ? "bg-white/10 text-stone-200"
                        : MAIN_PAGE_NAMESPACES.has(namespace)
                          ? "bg-[#63978f]/10 text-[#507f78]"
                          : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {namespaceType}
                  </span>

                  <span
                    className={`min-w-0 truncate font-mono text-[9px] ${
                      isSelected
                        ? "text-stone-400"
                        : "text-stone-400"
                    }`}
                  >
                    {namespace}
                  </span>
                </span>
              </span>

              <FiChevronRight
                className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  isSelected
                    ? "text-[#a9c9c4]"
                    : "text-stone-300"
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
})
            ) : (
              <p className="rounded-xl bg-stone-50 p-4 text-center text-sm text-stone-500">
                Aramanızla eşleşen sayfa bulunamadı.
              </p>
            )}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="z-10 overflow-hidden rounded-3xl border border-stone-200 bg-white/95 shadow-sm backdrop-blur lg:sticky lg:top-16">
            <div className="h-1 bg-gradient-to-r from-[#2f423f] via-[#63978f] to-[#a9c9c4]" />
            <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf5f3] text-[#507f78]">
                  <FiEdit3 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      Düzenlenen içerik
                    </p>
                    {hasUnsavedChanges ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Kaydedilmedi
                      </span>
                    ) : bundle ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        <FiCheck className="h-3 w-3" />
                        Güncel
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-1 truncate text-xl font-semibold text-stone-900 sm:text-2xl">
                    {selectedNamespace
                      ? getNamespaceLabel(selectedNamespace)
                      : "Sayfa seçin"}
                  </h2>
                  {selectedNamespace ? (
                    <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">
                      {selectedNamespace}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                    Düzenleme dili
                  </p>
                  <div className="inline-flex max-w-full rounded-xl bg-stone-100 p-1">
                    {CMS_LOCALES.map((locale) => (
                      <button
                        key={locale}
                        type="button"
                        onClick={() => setActiveLocale(locale)}
                        title={localeLabels[locale]}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase transition sm:px-4 ${
                          activeLocale === locale
                            ? "bg-[#2f423f] text-white shadow-sm"
                            : "text-stone-600 hover:bg-white hover:text-[#2f423f]"
                        }`}
                      >
                        {locale}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !bundle || !hasUnsavedChanges}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
                >
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <FiSave className="h-4 w-4" />
                  )}
                  {saving ? "Kaydediliyor..." : "Tüm Dilleri Kaydet"}
                </button>
              </div>
            </div>
            {message || error ? (
              <div
                aria-live="polite"
                className={`mt-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium ${
                  error
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : messageType === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {error || messageType === "warning" ? (
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{error || message}</span>
              </div>
            ) : null}
            </div>
          </section>

          {loadingBundle ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm" />
              ))}
            </div>
          ) : bundle ? (
            <div className="space-y-5">
              <ObjectEditor value={activeValue} onChange={updateActiveLocaleValue} />

            {SelectedMediaEditor ? (
  <SelectedMediaEditor
    namespace={selectedNamespace}
    activeLocale={activeLocale}
  />
) : null}

            </div>
          ) : (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#63978f]/40 bg-white px-6 py-14 text-center shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5f3] text-[#507f78]">
                <FiFileText className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-stone-800">Düzenlenecek içeriği seçin</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-stone-500">
                Metin ve medya alanlarını görüntülemek için soldaki listeden bir sayfa veya bölüm seçin.
              </p>
            </div>
          )}

          {error && !bundle ? (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>
      </div>

      {showUnsavedModal ? (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm"
    role="presentation"
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-description"
      className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
    >
      <div className="h-1.5 bg-amber-400" />
      <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <FiAlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>

          <h2
            id="unsaved-changes-title"
            className="mt-4 text-xl font-semibold text-stone-900"
          >
            Kaydedilmemiş değişiklikler var
          </h2>
        </div>

        <button
          type="button"
          onClick={handleCloseUnsavedModal}
          disabled={saving}
          aria-label="Uyarıyı kapat"
          className="rounded-xl p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiX className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <p
        id="unsaved-changes-description"
        className="mt-3 text-sm leading-6 text-stone-600"
      >
        Bu sayfada yaptığınız değişiklikleri henüz kaydetmediniz.
        Devam etmeden önce değişiklikleri kaydetmek ister misiniz?
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleDiscardAndContinue}
          disabled={saving}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kaydetmeden devam et
        </button>

        <button
          type="button"
          onClick={handleSaveAndContinue}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <FiSave className="h-4 w-4" />
          )}
          {saving ? "Kaydediliyor..." : "Kaydet ve devam et"}
        </button>
      </div>
      </div>
    </section>
  </div>
) : null}
    </div>
  );
}
