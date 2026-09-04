"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiChevronRight, FiFileText, FiSearch } from "react-icons/fi";
import ObjectEditor from "../components/ObjectEditor";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { RESTAURANT_DETAIL_CONFIGS } from "@/lib/admin/restaurant-detail-config.mjs";
import CertificateMediaEditor from "./CertificateMediaEditor";
import BarCafesMediaEditor from "./BarCafesMediaEditor";
import BarCafeDetailMediaEditor from "./BarCafeDetailMediaEditor";
import BeachPoolsMediaEditor from "./BeachPoolsMediaEditor";
import KidsClubMediaEditor from "./KidsClubMediaEditor";
import EntertainmentMediaEditor from "./EntertainmentMediaEditor";
import SpecialMediaEditor from "./SpecialMediaEditor";
import FitnessMediaEditor from "./FitnessMediaEditor";
import DisabledRoomMediaEditor from "./DisabledRoomMediaEditor";
import DuplexFamilyRoomMediaEditor from "./DuplexFamilyRoomMediaEditor";
import FamilyRoomMediaEditor from "./FamilyRoomMediaEditor";
import FamilySwimupRoomMediaEditor from "./FamilySwimupRoomMediaEditor";
import RestaurantDetailMediaEditor from "./RestaurantDetailMediaEditor";
import RoomsMediaEditor from "./RoomsMediaEditor";
import RestaurantsMediaEditor from "./RestaurantsMediaEditor";
import SharedRoomMediaEditor from "./SharedRoomMediaEditor";
import SpaWellnessMediaEditor from "./SpaWellnessMediaEditor";
import SuperiorRoomMediaEditor from "./SuperiorRoomMediaEditor";
import SwimupRoomMediaEditor from "./SwimupRoomMediaEditor";
import TinyVillaMediaEditor from "./TinyVillaMediaEditor";

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

function getNamespaceLabel(namespace) {
  if (namespaceLabels[namespace]) {
    return namespaceLabels[namespace];
  }

  return namespace.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

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

    let cancelled = false;

    const loadBundle = async () => {
      setLoadingBundle(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `/api/admin/messages/namespace?namespace=${encodeURIComponent(
            selectedNamespace
          )}`,
          { cache: "no-store" }
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "İçerik alınamadı.");
        }

        if (!cancelled) setBundle(payload.bundle);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoadingBundle(false);
      }
    };

    loadBundle();

    return () => {
      cancelled = true;
    };
  }, [selectedNamespace]);

  const activeValue = useMemo(() => bundle?.[activeLocale] || {}, [activeLocale, bundle]);
  const visibleGroups = useMemo(
    () => groupNamespaces(namespaces, query),
    [namespaces, query]
  );

  const updateActiveLocaleValue = (updater) => {
    setBundle((currentBundle) => ({
      ...currentBundle,
      [activeLocale]:
        typeof updater === "function"
          ? updater(currentBundle?.[activeLocale] || {})
          : updater,
    }));
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/messages/namespace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: selectedNamespace, bundle }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "İçerik kaydedilemedi.");
      }

      setBundle(payload.bundle);
      setMessage("Tüm diller başarıyla kaydedildi.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

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
        <aside className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-6">
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
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.namespaces.map((namespace) => {
                      const isSelected = selectedNamespace === namespace;

                      return (
                        <button
                          key={namespace}
                          type="button"
                          onClick={() => setSelectedNamespace(namespace)}
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

        <main className="min-w-0 space-y-5">
          <section className="z-10 rounded-2xl border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6 xl:sticky xl:top-6">
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
                  disabled={saving || !bundle}
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
                  message
                    ? "border-emerald-100 text-emerald-700"
                    : "border-rose-100 text-rose-700"
                }`}
              >
                {message || error}
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

              {selectedNamespace === "Certificates" ? <CertificateMediaEditor /> : null}
              {selectedNamespace === "Spa" ? (
                <SpaWellnessMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "Accommodation" ? (
                <RoomsMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "Restaurants" ? (
                <RestaurantsMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "BarAndCafes" ? (
                <BarCafesMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "BeachPools" ? (
                <BeachPoolsMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "KidsClub" ? (
                <KidsClubMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "Entertainment" ? (
                <EntertainmentMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "Special" ? (
                <SpecialMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "Fitness" ? (
                <FitnessMediaEditor activeLocale={activeLocale} />
              ) : null}
              <RestaurantDetailMediaEditor
                namespace={selectedNamespace}
                activeLocale={activeLocale}
              />
              <BarCafeDetailMediaEditor
                namespace={selectedNamespace}
                activeLocale={activeLocale}
              />
              {selectedNamespace === "RoomsParallax" ? (
                <SharedRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "SuperiorRoom" ? (
                <SuperiorRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "FamilyRoom" ? (
                <FamilyRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "SwimupRoom" ? (
                <SwimupRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "FamilySwimupRoom" ? (
                <FamilySwimupRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "DuplexFamilyRoom" ? (
                <DuplexFamilyRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "DisabledRoom" ? (
                <DisabledRoomMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "TinyVilla" ? (
                <TinyVillaMediaEditor activeLocale={activeLocale} />
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
        </main>
      </div>
    </div>
  );
}
