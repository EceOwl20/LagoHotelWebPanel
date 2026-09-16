"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiSave,
  FiX,
} from "react-icons/fi";
import ObjectEditor from "../components/ObjectEditor";
import { CMS_LOCALES } from "@/lib/admin/constants";
import dynamic from "next/dynamic";
import { RESTAURANT_DETAIL_CONFIGS } from "@/lib/admin/restaurant-detail-config.mjs";
import PageEditLockNotice from "../sayfalar/components/PageEditLockNotice";
import useContentEditLock from "./useContentEditLock";
import { ContentEditLockProvider } from "./ContentEditLockContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { usePanelPermission } from "../PanelSessionContext";
import { ContentWorkspaceHeader, ContentWorkspaceNavigation, ContentWorkspaceToolbar } from "../components/ContentWorkspace";

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
  const editLock = useContentEditLock(selectedNamespace);
  const canOverrideEditLock = usePanelPermission(
    PANEL_PERMISSIONS.OVERRIDE_EDIT_LOCK
  );

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
  if (!editLock.editable) return;

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
  if (saving || !selectedNamespace || !bundle || !editLock.editable) {
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
        "X-Panel-Edit-Lock": editLock.lockToken,
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

  const handleLockTakeover = () => {
    const editorName = editLock.lock?.displayName || "Diğer kullanıcı";
    const approved = window.confirm(
      `${editorName} bu içeriği düzenliyor. Kilidi devralırsanız diğer kullanıcının kaydetme yetkisi hemen sona erecek. Devam edilsin mi?`
    );

    if (approved) {
      editLock.takeover();
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <ContentWorkspaceHeader
        description="Sayfaların metinlerini ve medya alanlarını dört dilde, tek bir çalışma alanından güvenle yönetin."
        count={namespaces.length}
        loading={loading}
        dirty={hasUnsavedChanges}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <ContentWorkspaceNavigation
          groups={visibleGroups.map((group) => ({
            id: group.id,
            label: group.label,
            items: group.namespaces.map((namespace) => ({
              id: namespace,
              label: getNamespaceLabel(namespace),
              type: getNamespaceType(namespace),
              detail: isDetailNamespace(namespace),
              main: MAIN_PAGE_NAMESPACES.has(namespace),
            })),
          }))}
          selectedId={selectedNamespace}
          onSelect={handleNamespaceSelect}
          query={query}
          onQueryChange={setQuery}
          loading={loading}
        />

        <section className="min-w-0 space-y-5">
          <ContentWorkspaceToolbar
            title={selectedNamespace ? getNamespaceLabel(selectedNamespace) : "Sayfa seçin"}
            code={selectedNamespace}
            dirty={hasUnsavedChanges}
            current={Boolean(bundle)}
            locales={CMS_LOCALES}
            localeLabels={localeLabels}
            activeLocale={activeLocale}
            onLocaleChange={setActiveLocale}
            actions={(
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !bundle || !hasUnsavedChanges || !editLock.editable}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
              >
                {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FiSave className="h-4 w-4" />}
                {saving ? "Kaydediliyor..." : "Tüm Dilleri Kaydet"}
              </button>
            )}
          >
            {message || error ? (
              <div aria-live="polite" className={`mt-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium ${error ? "border-rose-200 bg-rose-50 text-rose-700" : messageType === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {error || messageType === "warning" ? <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{error || message}</span>
              </div>
            ) : null}
          </ContentWorkspaceToolbar>

          {loadingBundle ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-36 animate-pulse rounded-3xl border border-stone-200 bg-white shadow-sm" />
              ))}
            </div>
          ) : bundle ? (
            <div className="space-y-5">
              <PageEditLockNotice
                status={editLock.status}
                lock={editLock.lock}
                error={editLock.error}
                canOverride={canOverrideEditLock}
                onRetry={editLock.retry}
                onTakeover={handleLockTakeover}
              />

              <ContentEditLockProvider
                value={{
                  namespace: selectedNamespace,
                  lockToken: editLock.lockToken,
                  editable: editLock.editable,
                }}
              >
                <fieldset
                  disabled={!editLock.editable}
                  className="space-y-5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ObjectEditor value={activeValue} onChange={updateActiveLocaleValue} />

                  {SelectedMediaEditor ? (
                    <SelectedMediaEditor
                      namespace={selectedNamespace}
                      activeLocale={activeLocale}
                    />
                  ) : null}
                </fieldset>
              </ContentEditLockProvider>

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
