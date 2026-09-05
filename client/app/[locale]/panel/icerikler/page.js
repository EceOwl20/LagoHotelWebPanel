"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronRight, FiFileText, FiSearch, FiX } from "react-icons/fi";
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

const BAR_CAFE_DETAIL_NAMESPACES = [
  "JoieBar",
  "MaldivaBar",
  "MignonBar",
  "PianoBar",
  "VagoBar",
  "Abellapatisserie",
  "Cafedehouse",
  "Cafedelago",
];

const BAR_CAFE_DETAIL_EDITOR_ENTRIES = Object.fromEntries(
  BAR_CAFE_DETAIL_NAMESPACES.map((namespace) => [
    namespace,
    BarCafeDetailMediaEditor,
  ])
);

const MEDIA_EDITOR_REGISTRY = {
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
    <div className="mx-auto max-w-[1500px] space-y-7">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Sayfa İçerikleri
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">İçerik düzenleyici</h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          Düzenlemek istediğiniz sayfayı seçin, dili belirleyin ve metin alanlarını
          bölüm bölüm güncelleyin.
        </p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-12">
          <div className="border-b border-stone-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-900">Sayfa seçimi</p>
                <p className="mt-1 text-xs text-stone-500">{namespaces.length} içerik grubu</p>
              </div>
              <span className="rounded-xl bg-stone-100 p-2.5 text-stone-500">
                <FiFileText className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <label className="relative mt-4 block">
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
                className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-700 focus:bg-white focus:ring-4 focus:ring-stone-100"
              />
            </label>
          </div>

          <div className="max-h-[calc(100vh-15rem)] space-y-5 overflow-y-auto p-3">
            {loading ? (
              <p className="p-3 text-sm text-stone-500">Sayfalar yükleniyor...</p>
            ) : visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 px-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#63978f]">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.namespaces.map((namespace) => {
                      const isSelected = selectedNamespace === namespace;

                      return (
                        <button
                          key={namespace}
                          type="button"
                          onClick={() => handleNamespaceSelect(namespace)}
                          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            isSelected
                              ? "bg-stone-900 text-white shadow-sm"
                              : "text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-white/10 text-white"
                                : "bg-stone-100 text-stone-400 group-hover:bg-white"
                            }`}
                          >
                            {isSelected ? (
                              <FiCheck className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <FiFileText className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {getNamespaceLabel(namespace)}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[10px] text-stone-400">
                              {namespace}
                            </span>
                          </span>
                          <FiChevronRight
                            className={`h-4 w-4 shrink-0 ${
                              isSelected ? "text-stone-400" : "text-stone-300"
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-stone-50 p-4 text-center text-sm text-stone-500">
                Aramanızla eşleşen sayfa bulunamadı.
              </p>
            )}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="z-10 rounded-2xl border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6 lg:sticky lg:top-16">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-400">
                  Seçili sayfa / bölüm
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#63978f]">
                  {selectedNamespace
                    ? getNamespaceLabel(selectedNamespace)
                    : "Sayfa seçin"}
                </h2>
                {selectedNamespace ? (
                  <p className="mt-1 font-mono text-xs text-stone-400">
                    {selectedNamespace}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="mb-2 text-xs font-medium text-stone-500">Düzenleme dili</p>
                  <div className="inline-flex rounded-xl bg-stone-100 p-1">
                    {CMS_LOCALES.map((locale) => (
                      <button
                        key={locale}
                        type="button"
                        onClick={() => setActiveLocale(locale)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase transition ${
                          activeLocale === locale
                            ? "bg-stone-900 text-white shadow-sm"
                            : "text-stone-600 hover:bg-white"
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
                  className="rounded-xl bg-[#63978f] px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Tüm Dilleri Kaydet"}
                </button>
              </div>
            </div>
            {message || error ? (
              <p
                aria-live="polite"
                className={`mt-4 border-t pt-4 text-sm font-medium ${
                  error
        ? "border-rose-100 text-rose-700"
        : messageType === "warning"
          ? "border-amber-100 text-amber-700"
          : "border-emerald-100 text-emerald-700"
    }`}
              >
                {error || message}
              </p>
            ) : null}
          </section>

          {loadingBundle ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-white"
                />
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
            <p className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500 shadow-sm">
              Düzenlemek için soldan bir sayfa veya bölüm seçin.
            </p>
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
      className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <FiFileText className="h-5 w-5" aria-hidden="true" />
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
          className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kaydetmeden devam et
        </button>

        <button
          type="button"
          onClick={handleSaveAndContinue}
          disabled={saving}
          className="rounded-xl bg-[#63978f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#527f78] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Kaydet ve devam et"}
        </button>
      </div>
    </section>
  </div>
) : null}
    </div>
  );
}
