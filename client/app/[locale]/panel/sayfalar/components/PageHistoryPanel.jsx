"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageTemplate from "../../../_page-template/StandardPageTemplate";
import { comparePageDrafts } from "@/lib/pages/page-draft-comparison.mjs";
import {
  FiAlertCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiGitCommit,
  FiGlobe,
  FiLayers,
  FiRefreshCw,
  FiUser,
  FiX,
} from "react-icons/fi";

const localeLabels = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

const componentChangeLabels = {
  text: "Metin veya başlık değişti",
  image: "Görsel değişti",
  images: "Görsel listesi değişti",
  collection: "Kart veya liste içeriği değişti",
  settings: "Component ayarı değişti",
  content: "Component içeriği değişti",
};

function getComponentChanges(comparison) {
  if (!comparison?.componentChanges) return [];

  return [
    ...comparison.componentChanges.added.map((component) => ({
      ...component,
      changeLabel: "Component eklendi",
      tone: "emerald",
    })),
    ...comparison.componentChanges.removed.map((component) => ({
      ...component,
      changeLabel: "Component kaldırıldı",
      tone: "rose",
    })),
    ...comparison.componentChanges.modified.map((component) => ({
      ...component,
      changeLabel: component.changeTypes
        .map((changeType) => componentChangeLabels[changeType])
        .filter(Boolean)
        .join(" · "),
      tone: "amber",
    })),
  ];
}

function formatDate(value) {
  if (!value) return "Tarih bulunamadı";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PageHistoryPanel({ pageId, currentDraft }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [versionDetail, setVersionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [activeLocale, setActiveLocale] = useState("tr");
  const [reloadToken, setReloadToken] = useState(0);
  const [comparisonVisible, setComparisonVisible] = useState(false);

  useEffect(() => {
    if (!isOpen || !pageId) return undefined;

    const controller = new AbortController();

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");
      setSelectedVersionId("");
      setVersionDetail(null);

      try {
        const response = await fetch(`/api/admin/pages/${pageId}/history`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "Sürüm geçmişi alınamadı.");
        }

        const versions = Array.isArray(payload.versions) ? payload.versions : [];
        setHistory({ ...payload, versions });
        setSelectedVersionId((currentVersionId) =>
          versions.some((version) => version.versionId === currentVersionId)
            ? currentVersionId
            : versions[0]?.versionId || ""
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setHistoryError(error.message || "Sürüm geçmişi alınamadı.");
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => controller.abort();
  }, [isOpen, pageId, reloadToken]);

  useEffect(() => {
    if (!isOpen || !pageId || !selectedVersionId) {
      setVersionDetail(null);
      setDetailError("");
      return undefined;
    }

    const controller = new AbortController();

    const loadVersionDetail = async () => {
      setDetailLoading(true);
      setDetailError("");
      setVersionDetail(null);

      try {
        const response = await fetch(
          `/api/admin/pages/${pageId}/history/${selectedVersionId}`,
          { cache: "no-store", signal: controller.signal }
        );
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "Geçmiş sürüm alınamadı.");
        }

        setVersionDetail(payload);
      } catch (error) {
        if (error.name !== "AbortError") {
          setDetailError(error.message || "Geçmiş sürüm alınamadı.");
        }
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    };

    loadVersionDetail();
    return () => controller.abort();
  }, [isOpen, pageId, selectedVersionId]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedVersion = history?.versions.find(
    (version) => version.versionId === selectedVersionId
  );
  const comparison = useMemo(() => {
    if (
      !isOpen ||
      !comparisonVisible ||
      !versionDetail?.version?.draft ||
      !currentDraft
    ) {
      return null;
    }

    return comparePageDrafts(versionDetail.version.draft, currentDraft);
  }, [comparisonVisible, currentDraft, isOpen, versionDetail?.version?.draft]);
  const componentChanges = useMemo(
    () => getComponentChanges(comparison),
    [comparison]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setComparisonVisible(false);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-stone-100 backdrop-blur-sm transition hover:bg-white/20"
      >
        <FiClock className="h-4 w-4 text-[#a9c9c4]" />
        Sürüm Geçmişi
      </button>

      {isOpen ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/65 p-3 backdrop-blur-sm md:p-6"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-history-title"
            className="flex max-h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4 md:px-7 md:py-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf5f3] text-[#507f78]">
                  <FiClock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#507f78]">
                    Salt okunur geçmiş
                  </p>
                  <h2
                    id="page-history-title"
                    className="mt-1 truncate text-xl font-semibold text-stone-900"
                  >
                    {history?.page?.title || "Sürüm geçmişi"}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    Geçmiş sürümü incelemek güncel taslağı ve yayındaki sayfayı değiştirmez.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Sürüm geçmişini kapat"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-b border-stone-200 bg-white p-4 lg:border-b-0 lg:border-r">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">Kayıtlı sürümler</h3>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {history
                        ? `${history.versions.length}/${history.limit} sürüm kullanılıyor`
                        : "Sürümler yükleniyor"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReloadToken((value) => value + 1)}
                    disabled={historyLoading}
                    aria-label="Sürüm listesini yenile"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-500 transition hover:bg-stone-100 disabled:opacity-50"
                  >
                    <FiRefreshCw
                      className={`h-4 w-4 ${historyLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>

                {historyLoading ? (
                  <div className="space-y-3 pt-2">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-28 animate-pulse rounded-2xl bg-stone-100"
                      />
                    ))}
                  </div>
                ) : historyError ? (
                  <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{historyError}</span>
                    </div>
                  </div>
                ) : history?.versions.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                    <FiFileText className="mx-auto h-6 w-6 text-stone-400" />
                    <p className="mt-3 text-sm font-medium text-stone-700">
                      Henüz geçmiş sürüm yok
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Sayfada ilk anlamlı değişiklik kaydedildiğinde önceki taslak burada görünür.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    {history?.versions.map((version, index) => {
                      const isSelected = version.versionId === selectedVersionId;

                      return (
                        <button
                          key={version.versionId}
                          type="button"
                          onClick={() => {
                            setSelectedVersionId(version.versionId);
                            setComparisonVisible(false);
                          }}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-[#63978f] bg-[#edf5f3] shadow-sm"
                              : "border-stone-200 bg-white hover:border-[#63978f]/50 hover:bg-stone-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-semibold text-stone-900">
                              {index + 1}. önceki sürüm
                            </span>
                            <span className={`h-2 w-2 shrink-0 rounded-full ${
                              isSelected ? "bg-[#63978f]" : "bg-stone-300"
                            }`} />
                          </div>
                          <p className="mt-2 truncate text-sm font-medium text-stone-800">
                            {version.title}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                            <FiClock className="h-3 w-3" />
                            {formatDate(version.createdAt)}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-stone-500">
                            <FiUser className="h-3 w-3 shrink-0" />
                            {version.createdBy?.displayName ||
                              version.createdBy?.username ||
                              "Kullanıcı bilgisi yok"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </aside>

              <div className="min-h-0 overflow-y-auto p-4 md:p-6">
                {!selectedVersionId && !historyLoading ? (
                  <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
                    Ön izlemek için kayıtlı bir sürüm seçin.
                  </div>
                ) : detailLoading ? (
                  <div className="h-96 animate-pulse rounded-3xl border border-stone-200 bg-white" />
                ) : detailError ? (
                  <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{detailError}</span>
                    </div>
                  </div>
                ) : versionDetail?.version ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#507f78]">
                            <FiEye className="h-3.5 w-3.5" />
                            Geçmiş sürüm ön izlemesi
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-stone-900">
                            {selectedVersion?.title || versionDetail.version.title}
                          </h3>
                          <p className="mt-1 text-xs text-stone-500">
                            {formatDate(versionDetail.version.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setComparisonVisible((value) => !value)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              comparisonVisible
                                ? "bg-[#2f423f] text-white"
                                : "bg-[#edf5f3] text-[#3f6e67] hover:bg-[#dcece8]"
                            }`}
                          >
                            <FiGitCommit className="h-3.5 w-3.5" />
                            {comparisonVisible ? "Farkları gizle" : "Farkları göster"}
                          </button>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-600">
                            <FiLayers className="h-3.5 w-3.5" />
                            {versionDetail.version.componentCount} component
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-600">
                            <FiGlobe className="h-3.5 w-3.5" />
                            {versionDetail.version.wasPublished
                              ? "O tarihte yayındaydı"
                              : "O tarihte taslaktı"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
                        {Object.entries(localeLabels).map(([locale, label]) => (
                          <button
                            key={locale}
                            type="button"
                            onClick={() => setActiveLocale(locale)}
                            className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                              activeLocale === locale
                                ? "bg-[#2f423f] text-white"
                                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {comparison ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            comparison.isIdentical
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            <FiGitCommit className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-stone-900">
                              {comparison.isIdentical
                                ? "Güncel taslakla aynı"
                                : "Güncel taslaktan farklı"}
                            </h4>
                            <p className="mt-1 text-xs leading-5 text-stone-500">
                              Karşılaştırma yalnızca seçili sürüm için bu ekranda hesaplanır.
                            </p>

                            {componentChanges.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {componentChanges.map((component, index) => (
                                  <div
                                    key={`${component.id}-${component.tone}-${index}`}
                                    className={`rounded-xl border px-3 py-2.5 ${
                                      component.tone === "emerald"
                                        ? "border-emerald-200 bg-emerald-50"
                                        : component.tone === "rose"
                                          ? "border-rose-200 bg-rose-50"
                                          : "border-amber-200 bg-amber-50"
                                    }`}
                                  >
                                    <p className="text-xs font-semibold text-stone-800">
                                      {component.label} · {component.position}. component
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-4 text-stone-600">
                                      {component.changeLabel}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {!comparison.isIdentical ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {comparison.changedLocales.length > 0 ? (
                                  <span className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs text-stone-700">
                                    Dil içeriği: {comparison.changedLocales
                                      .map((locale) => localeLabels[locale])
                                      .join(", ")}
                                  </span>
                                ) : null}
                                {comparison.settingsChanged ? (
                                  <span className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs text-stone-700">
                                    Sayfa ayarları değişmiş
                                  </span>
                                ) : null}
                                {comparison.components.added > 0 ? (
                                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                                    +{comparison.components.added} component
                                  </span>
                                ) : null}
                                {comparison.components.removed > 0 ? (
                                  <span className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">
                                    -{comparison.components.removed} component
                                  </span>
                                ) : null}
                                {comparison.components.modified > 0 ? (
                                  <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                                    {comparison.components.modified} component değişmiş
                                  </span>
                                ) : null}
                                {comparison.components.orderChanged ? (
                                  <span className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs text-sky-700">
                                    Component sırası değişmiş
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
                      <div
                        aria-label="Geçmiş sürüm sayfa önizlemesi"
                        className="rounded-2xl"
                      >
                        <div className="pointer-events-none">
                          <StandardPageTemplate
                            page={versionDetail.version.draft}
                            locale={activeLocale}
                            preview
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
