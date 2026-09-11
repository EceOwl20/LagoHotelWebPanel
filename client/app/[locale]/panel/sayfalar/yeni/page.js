"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import StandardPageTemplate from "../../../_page-template/StandardPageTemplate";
import BlockDefinitionFields from "../components/BlockDefinitionFields";
import PageBuilderHeader from "../components/PageBuilderHeader";
import PageEditLockNotice from "../components/PageEditLockNotice";
import PageSettingsEditor from "../components/PageSettingsEditor";
import usePageEditLock from "../components/usePageEditLock";
import {
  createPageSection,
  validatePageDocument,
} from "@/lib/pages/schema.mjs";
import {
  PAGE_PRESETS,
  createPageDraftFromPreset,
} from "@/lib/pages/page-presets.mjs";
import {
  PAGE_DRAFT_ACTIONS,
  pageDraftReducer,
} from "@/lib/pages/page-draft-reducer.mjs";
import {
  getBlockDefinition,
  getBlockDefinitionsForTemplate,
} from "@/lib/pages/block-definitions.mjs";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { usePanelPermission } from "../../PanelSessionContext";
import {
  FiAlignLeft,
  FiArrowDown,
  FiArrowUp,
  FiAlertCircle,
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiColumns,
  FiCompass,
  FiCopy,
  FiEye,
  FiFileText,
  FiGrid,
  FiImage,
  FiLayers,
  FiList,
  FiPlayCircle,
  FiPlus,
  FiSave,
  FiTarget,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const localeLabels = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

const componentLibrary = getBlockDefinitionsForTemplate("standard");

const componentLibraryIcons = {
  intro: FiAlignLeft,
  imageText: FiColumns,
  twoAnimationImage: FiCopy,
  spaInfo: FiList,
  otherOptions: FiCompass,
  gallery: FiImage,
  carousel: FiPlayCircle,
  callToAction: FiTarget,
  cardCollection: FiGrid,
};

function ComponentLibraryIcon({ type }) {
  const Icon = componentLibraryIcons[type] || FiBox;

  return <Icon aria-hidden="true" className="h-4 w-4" />;
}

function serializeDraft(draft) {
  return JSON.stringify(draft);
}

function getValidationDestination(error, draft) {
  const localeMatch = error.match(/^(TR|EN|DE|RU) slug\b/);

  if (localeMatch) {
    const locale = localeMatch[1].toLowerCase();
    return {
      error,
      locale,
      target: `slug-${locale}`,
      context: `${localeLabels[locale]} adresi`,
    };
  }

  const sectionMatch = error.match(/^Bölüm (\d+)\b/);

  if (sectionMatch) {
    const sectionIndex = Number(sectionMatch[1]) - 1;
    const section = draft.sections?.[sectionIndex];
    const definition = section ? getBlockDefinition(section.type) : null;

    return {
      error,
      target: `section-${sectionIndex}`,
      context: definition?.label || `Bölüm ${sectionIndex + 1}`,
      opensSection: true,
    };
  }

  return {
    error,
    target: "page-settings",
    context: "Sayfa ayarları",
  };
}

function SectionEditor({
  section,
  locale,
  onTranslationChange,
  onFieldChange,
  onMove,
  onRemove,
  initiallyOpen = false,
  index,
  totalSections,
}) {
  const [isOpen, setIsOpen] = useState(index === 0 || initiallyOpen);
  const definition = getBlockDefinition(section.type);
  const isLast = index === totalSections - 1;
  const isEnabled = section.enabled !== false;

  return (
    <div
      data-section-id={section.id}
      data-validation-target={`section-${index}`}
      className={`scroll-mt-24 rounded-2xl transition-shadow duration-500 ${
        initiallyOpen ? "ring-4 ring-[#63978f]/20" : ""
      } flex gap-4`}
    >
      {/* Sıra rayı: component'lerin bir akış olduğunu gösteren bağlantı çizgisi */}
      <div className="flex w-9 shrink-0 flex-col items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2f423f] text-xs font-semibold text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        {!isLast ? <span className="mt-1 w-px flex-1 bg-stone-200" /> : null}
      </div>

      <details
        open={isOpen}
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
        className="group mb-1 flex-1 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition open:border-[#63978f]/50 open:shadow-md"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              {definition?.label || section.type}
            </span>
            <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-normal text-stone-400">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isEnabled ? "bg-emerald-500" : "bg-stone-300"
                }`}
              />
              {isEnabled ? "Bölüm aktif" : "Bölüm gizli"}
            </span>
          </span>
          <FiChevronDown className="h-4 w-4 shrink-0 text-stone-400 transition group-open:rotate-180" />
        </summary>
        <div className="grid gap-5 border-t border-stone-200 bg-stone-50/70 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => onFieldChange("enabled", event.target.checked)}
                className="h-4 w-4 rounded border-stone-300 accent-[#63978f]"
              />
              Sayfada göster
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isEnabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {isEnabled ? "Aktif" : "Gizli"}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-lg border border-stone-300 bg-white">
                <button
                  type="button"
                  onClick={() => onMove(-1)}
                  disabled={index === 0}
                  title="Yukarı taşı"
                  className="flex h-9 w-9 items-center justify-center text-stone-600 transition hover:bg-stone-100 hover:text-[#2f423f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiArrowUp className="h-4 w-4" />
                  <span className="sr-only">Yukarı Taşı</span>
                </button>
                <span className="h-5 w-px bg-stone-200" />
                <button
                  type="button"
                  onClick={() => onMove(1)}
                  disabled={isLast}
                  title="Aşağı taşı"
                  className="flex h-9 w-9 items-center justify-center text-stone-600 transition hover:bg-stone-100 hover:text-[#2f423f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiArrowDown className="h-4 w-4" />
                  <span className="sr-only">Aşağı Taşı</span>
                </button>
              </div>
              <button
                type="button"
                onClick={onRemove}
                title="Componenti kaldır"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
              >
                <FiTrash2 className="h-4 w-4" />
                <span className="sr-only">Componenti Kaldır</span>
              </button>
            </div>
          </div>
          {definition ? (
            <BlockDefinitionFields
              definition={definition}
              section={section}
              locale={locale}
              onTranslationChange={onTranslationChange}
              onFieldChange={onFieldChange}
            />
          ) : null}
        </div>
      </details>
    </div>
  );
}

const PagePreview = memo(function PagePreview({ page, locale }) {
  return <StandardPageTemplate page={page} locale={locale} preview />;
});

export default function NewPageAdminPage() {
  const params = useParams();
  const router = useRouter();
  const canPublish = usePanelPermission(PANEL_PERMISSIONS.PUBLISH_CONTENT);
  const canOverrideEditLock = usePanelPermission(PANEL_PERMISSIONS.OVERRIDE_EDIT_LOCK);
  const pageId = typeof params.id === "string" ? params.id : null;
  const isEditing = Boolean(pageId);
  const editLock = usePageEditLock(pageId);
  const [draft, dispatchDraft] = useReducer(
    pageDraftReducer,
    null,
    () => createPageDraftFromPreset("editorial")
  );
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState(() =>
    serializeDraft(draft)
  );
  const [draftRevision, setDraftRevision] = useState(0);
  const [activeLocale, setActiveLocale] = useState("tr");
  const [loadingPage, setLoadingPage] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(isEditing);
  const [pendingNavigationHref, setPendingNavigationHref] = useState("");
  const [lastAddedSectionId, setLastAddedSectionId] = useState(null);
  const [addedSectionNotice, setAddedSectionNotice] = useState("");
  const loadedPageKeyRef = useRef("");
  const allowNavigationRef = useRef(false);
  const changeDraft = useCallback((action) => {
    dispatchDraft(action);
    setDraftRevision((revision) => revision + 1);
  }, []);
  const acceptSavedDraft = useCallback((savedDraft) => {
    dispatchDraft({ type: PAGE_DRAFT_ACTIONS.REPLACE, draft: savedDraft });
    setSavedDraftSnapshot(serializeDraft(savedDraft));
    setDraftRevision(0);
  }, []);
  const deferredPreviewDraft = useDeferredValue(draft);
  const isPreviewUpdating = deferredPreviewDraft !== draft;
  const hasUnsavedChanges = draftRevision > 0;
  const validationErrors = useMemo(
    () => validatePageDocument(draft),
    [draft]
  );
  const shouldShowValidationErrors = isEditing || validationAttempted;
  const actionValidationErrors = useMemo(() => {
    if (!shouldShowValidationErrors) return [];

    return validationErrors.map((error) => getValidationDestination(error, draft));
  }, [
    draft,
    shouldShowValidationErrors,
    validationErrors,
  ]);
  const hasSaveBlockingErrors =
    shouldShowValidationErrors && validationErrors.length > 0;
  const editingPageTitle = useMemo(() => {
    if (!isEditing) return "";

    return (
      draft.hero?.translations?.tr?.title ||
      draft.hero?.translations?.en?.title ||
      draft.hero?.translations?.de?.title ||
      draft.hero?.translations?.ru?.title ||
      draft.slugs?.tr ||
      draft.slugs?.en ||
      "Başlıksız sayfa"
    );
  }, [draft, isEditing]);

  useEffect(() => {
    if (!pageId || editLock.status === "acquiring") {
      return;
    }

    const loadKey = `${pageId}:${editLock.status === "owned" ? "owned" : "readonly"}`;
    if (loadedPageKeyRef.current === loadKey) return;
    loadedPageKeyRef.current = loadKey;

    let cancelled = false;

    const loadPage = async () => {
      setLoadingPage(true);

      try {
        const response = await fetch(`/api/admin/pages/${pageId}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Sayfa taslağı alınamadı.");
        }

        if (!cancelled) {
          acceptSavedDraft(payload.page);
        }
      } catch (error) {
        if (!cancelled) {
          loadedPageKeyRef.current = "";
          setSaveError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [acceptSavedDraft, editLock.status, pageId]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const revisionAtSchedule = draftRevision;
    const comparisonTimeout = window.setTimeout(() => {
      if (serializeDraft(draft) !== savedDraftSnapshot) return;

      setDraftRevision((currentRevision) =>
        currentRevision === revisionAtSchedule ? 0 : currentRevision
      );
    }, 350);

    return () => window.clearTimeout(comparisonTimeout);
  }, [draft, draftRevision, hasUnsavedChanges, savedDraftSnapshot]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges || allowNavigationRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!lastAddedSectionId) return undefined;

    const animationFrame = window.requestAnimationFrame(() => {
      const sectionElement = document.querySelector(
        `[data-section-id="${lastAddedSectionId}"]`
      );

      if (!sectionElement) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      sectionElement.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
      sectionElement.querySelector("summary")?.focus({ preventScroll: true });
    });

    const noticeTimeout = window.setTimeout(() => {
      setLastAddedSectionId(null);
      setAddedSectionNotice("");
    }, 3500);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(noticeTimeout);
    };
  }, [lastAddedSectionId]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleDocumentLinkClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      if (
        targetUrl.origin !== window.location.origin ||
        targetUrl.href === window.location.href
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigationHref(targetUrl.href);
    };

    document.addEventListener("click", handleDocumentLinkClick, true);
    return () => document.removeEventListener("click", handleDocumentLinkClick, true);
  }, [hasUnsavedChanges]);

  const applyPreset = (preset) => {
    if (
      !window.confirm(
        `${preset.title} preseti uygulansın mı? Mevcut component düzeni değişecek; slug, hero, header ve SEO alanları korunacak.`
      )
    ) {
      return;
    }

    changeDraft({ type: PAGE_DRAFT_ACTIONS.APPLY_PRESET, presetId: preset.id });
    setLastAddedSectionId(null);
  };

  const updateSectionTranslation = (sectionId, field, value) => {
    changeDraft({
      type: PAGE_DRAFT_ACTIONS.UPDATE_SECTION_TRANSLATION,
      sectionId,
      locale: activeLocale,
      field,
      value,
    });
  };

  const updateSectionField = (sectionId, field, value) => {
    changeDraft({
      type: PAGE_DRAFT_ACTIONS.UPDATE_SECTION_FIELD,
      sectionId,
      field,
      value,
    });
  };

  const moveSection = (index, direction) => {
    changeDraft({ type: PAGE_DRAFT_ACTIONS.MOVE_SECTION, index, direction });
  };

  const addSection = (type) => {
    const section = createPageSection(type);
    const definition = getBlockDefinition(type);
    changeDraft({ type: PAGE_DRAFT_ACTIONS.ADD_SECTION, section });
    setLastAddedSectionId(section.id);
    setAddedSectionNotice(
      `${definition?.libraryTitle || definition?.label || "Component"} sayfa akışına eklendi.`
    );
  };

  const removeSection = (section) => {
    const label = getBlockDefinition(section.type)?.label || section.type;

    if (!window.confirm(`${label} componentini sayfadan kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    changeDraft({ type: PAGE_DRAFT_ACTIONS.REMOVE_SECTION, sectionId: section.id });
  };

  const saveDraft = async ({ notify = true, publicationStatus } = {}) => {
    if (isEditing && !editLock.editable) {
      throw new Error("Düzenleme kilidi olmadan bu sayfa kaydedilemez.");
    }

    const endpoint = pageId ? `/api/admin/pages/${pageId}` : "/api/admin/pages";
    const response = await fetch(endpoint, {
      method: pageId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(isEditing ? { "X-Panel-Edit-Lock": editLock.lockToken } : {}),
      },
      body: JSON.stringify({
        page: draft,
        ...(publicationStatus !== undefined ? { publicationStatus } : {}),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error ||
          (publicationStatus !== undefined
            ? "Sayfa kaydedilip yayın durumu değiştirilemedi."
            : "Sayfa taslağı kaydedilemedi.")
      );
    }

    if (notify) {
      window.dispatchEvent(new Event("admin-pages-updated"));
    }

    return payload.page;
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      setValidationAttempted(true);
      setSaveError("");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const savedPage = await saveDraft();
      acceptSavedDraft(savedPage);
      allowNavigationRef.current = true;

      router.push("/panel/sayfalar");
      router.refresh();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublicationChange = async (status) => {
    if (!pageId) {
      return;
    }

    setChangingStatus(true);
    setSaveError("");

    try {
      const savedPage = await saveDraft({
        notify: false,
        publicationStatus: status,
      });
      acceptSavedDraft(savedPage);
      window.dispatchEvent(new Event("admin-pages-updated"));
      allowNavigationRef.current = true;
      router.push("/panel/sayfalar");
      router.refresh();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSaveAndContinueNavigation = async () => {
    if (!pendingNavigationHref) return;

    setSaving(true);
    setSaveError("");

    try {
      const savedPage = await saveDraft();
      acceptSavedDraft(savedPage);
      allowNavigationRef.current = true;
      window.location.assign(pendingNavigationHref);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAndContinueNavigation = () => {
    if (!pendingNavigationHref) return;

    allowNavigationRef.current = true;
    window.location.assign(pendingNavigationHref);
  };

  const handleCloseUnsavedModal = () => {
    if (saving) return;
    setPendingNavigationHref("");
  };

  const focusValidationDestination = (destination) => {
    if (destination.locale) {
      setActiveLocale(destination.locale);
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const targetElement = Array.from(
          document.querySelectorAll("[data-validation-target]")
        ).find((element) => element.dataset.validationTarget === destination.target);

        if (!targetElement) return;

        const detailsElement = destination.opensSection
          ? targetElement.querySelector("details")
          : targetElement.closest("details");

        if (detailsElement) {
          detailsElement.open = true;
        }

        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        targetElement.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });

        const focusTarget = destination.opensSection
          ? targetElement.querySelector("summary")
          : targetElement.querySelector("input, textarea, select, button, summary");
        focusTarget?.focus({ preventScroll: true });
      });
    });
  };

  const handleLockTakeover = () => {
    const editorName = editLock.lock?.displayName || "diğer kullanıcı";
    if (
      window.confirm(
        `${editorName} bu sayfayı düzenliyor. Kilidi devralırsanız diğer kullanıcının kaydetme yetkisi hemen sona erecek. Devam edilsin mi?`
      )
    ) {
      editLock.takeover();
    }
  };

  if (loadingPage) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
        Sayfa taslağı yükleniyor...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
      <PageBuilderHeader
        pageId={pageId}
        draft={draft}
        editingPageTitle={editingPageTitle}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {addedSectionNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-20 z-[80] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-xl sm:right-6 sm:max-w-sm"
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold text-stone-900">Component eklendi</span>
            <span className="mt-0.5 block text-xs leading-5 text-stone-500">
              {addedSectionNotice}
            </span>
          </span>
        </div>
      ) : null}

      <PageEditLockNotice
        status={editLock.status}
        lock={editLock.lock}
        error={editLock.error}
        canOverride={canOverrideEditLock}
        onRetry={editLock.retry}
        onTakeover={handleLockTakeover}
      />

      <fieldset
        disabled={(isEditing && !editLock.editable) || saving || changingStatus}
        className="space-y-10 disabled:cursor-not-allowed disabled:opacity-70"
      >
      <div className="flex items-start gap-3 rounded-2xl border border-[#63978f]/30 bg-[#edf5f3] p-4 text-sm leading-6 text-[#2f423f] shadow-sm">
        <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#507f78]" />
        <p>
          <span className="font-semibold">Güvenli taslak çalışma alanı.</span>{" "}
          Taslağı kaydetmek canlı sayfayı değiştirmez. Yeni içerik yalnızca yeniden
          yayınlandığında ziyaretçilere gösterilir.
        </p>
      </div>

      {!isEditing ? (
        <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-start gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-5 md:px-7">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white">
              <FiFileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#507f78]">
                Başlangıç düzeni
              </p>
              <h2 className="mt-1 text-xl font-semibold text-stone-900">Sayfa preseti seç</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-500">
                Hazır bir component akışı seçin. Slug, hero, header ve SEO alanları korunur.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-7">
            {PAGE_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="group flex flex-col items-start rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#63978f] hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-stone-900">{preset.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-stone-500">
                  {preset.description}
                </p>
                <button
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="mt-5 rounded-xl border border-[#63978f]/40 bg-[#edf5f3] px-3.5 py-2.5 text-xs font-semibold text-[#2f423f] transition group-hover:bg-[#63978f] group-hover:text-white"
                >
                  Bu düzeni uygula
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <PageSettingsEditor
        draft={draft}
        activeLocale={activeLocale}
        localeLabels={localeLabels}
        onActiveLocaleChange={setActiveLocale}
        onDraftChange={changeDraft}
      >
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiLayers className="h-4 w-4 text-[#507f78]" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Sayfa akışı</h3>
                <p className="mt-1 text-xs text-stone-500">
                  Hızlı ekleme alanından yeni bir bölüm seçin; mevcut bölümleri açarak düzenleyin.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#edf5f3] px-3 py-1.5 text-xs font-semibold text-[#507f78]">
              {draft.sections.length} bölüm
            </span>
          </div>
          <div className="space-y-4">
          <div className="rounded-2xl border border-[#63978f]/35 bg-[#edf5f3]/70 p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f423f] text-white shadow-sm">
                  <FiPlus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Hızlı component ekle</h3>
                  <p className="mt-1 text-xs text-stone-500">
                    Bir component seçin; sayfa akışının sonuna eklenip otomatik olarak açılsın.
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-[#63978f]/25 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#507f78]">
                {componentLibrary.length} seçenek
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {componentLibrary.map((component) => (
                <button
                  key={component.type}
                  type="button"
                  onClick={() => addSection(component.type)}
                  title={component.description}
                  className="group/component flex min-h-12 items-center gap-3 rounded-xl border border-white bg-white/90 px-3.5 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#63978f] hover:shadow-md"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5f3] text-[#2f423f] transition group-hover/component:bg-[#63978f] group-hover/component:text-white">
                    <ComponentLibraryIcon type={component.type} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-800">
                    {component.libraryTitle}
                  </span>
                  <FiPlus className="h-4 w-4 shrink-0 text-stone-300 transition group-hover/component:text-[#507f78]" />
                </button>
              ))}
            </div>
          </div>

          {draft.sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              locale={activeLocale}
              index={index}
              totalSections={draft.sections.length}
              initiallyOpen={section.id === lastAddedSectionId}
              onTranslationChange={(field, value) =>
                updateSectionTranslation(section.id, field, value)
              }
              onFieldChange={(field, value) => updateSectionField(section.id, field, value)}
              onMove={(direction) => moveSection(index, direction)}
              onRemove={() => removeSection(section)}
            />
          ))}
        </div>
        </div>
      </PageSettingsEditor>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-5 md:px-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white">
              <FiEye className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#507f78]">
                Canlı önizleme
              </p>
              <h2 className="mt-1 text-xl font-semibold text-stone-900">
                {localeLabels[activeLocale]} görünümü
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-500">
                Sayfanın yayınlanmadan önceki yaklaşık görünümünü kontrol edin.
              </p>
            </div>
          </div>
          <span
            aria-live="polite"
            className={`mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isPreviewUpdating
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {isPreviewUpdating ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            ) : (
              <FiCheckCircle className="h-3.5 w-3.5" />
            )}
            {isPreviewUpdating ? "Güncelleniyor" : "Güncel"}
          </span>
        </div>
        <div aria-busy={isPreviewUpdating} className="bg-stone-100 p-3 md:p-6">
          <div className="overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-stone-200">
            <PagePreview page={deferredPreviewDraft} locale={activeLocale} />
          </div>
          <p className="mt-4 px-1 text-xs leading-5 text-stone-500">
            Panel önizlemesinde iletişim bölümü performans ve ekran alanı için gizlidir;
            yayınlanan standart şablonda görünür olacaktır.
          </p>
        </div>
      </section>

      <div className="sticky bottom-4 z-20 flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md lg:flex-row lg:items-end lg:justify-between lg:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              hasSaveBlockingErrors
                ? "bg-rose-500"
                : hasUnsavedChanges
                ? "bg-amber-400"
                : isEditing
                  ? "bg-emerald-500"
                  : "bg-stone-400"
            }`}
          />
          <div>
          <p className="text-sm font-medium text-stone-900">
            {hasUnsavedChanges
              ? "Kaydedilmemiş değişiklikler var"
              : isEditing
                ? "Tüm değişiklikler kaydedildi"
                : "Yeni taslak kaydedilmeye hazır"}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Yayın durumu:{" "}
            {draft.status === "published"
              ? draft.hasUnpublishedChanges
                ? "Yayında · Yayınlanmamış taslak değişiklikleri var"
                : "Yayında"
              : "Taslak"}
          </p>
          {saveError ? <p className="mt-2 text-sm text-rose-600">{saveError}</p> : null}
          </div>
          </div>

          {actionValidationErrors.length > 0 ? (
            <div
              role="alert"
              className="mt-3 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <FiAlertCircle
                  className="h-4 w-4 shrink-0 text-rose-600"
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold text-rose-800">
                  {actionValidationErrors.length} doğrulama hatası kaydetmeyi engelliyor
                </p>
              </div>
              <div className="mt-2 flex max-h-24 flex-col gap-1 overflow-y-auto pr-1">
                {actionValidationErrors.map((destination, index) => (
                  <button
                    key={`${destination.error}-${index}`}
                    type="button"
                    onClick={() => focusValidationDestination(destination)}
                    className="group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-rose-700 transition hover:bg-rose-100"
                  >
                    <span className="mt-px shrink-0 font-semibold group-hover:underline">
                      {destination.context}
                    </span>
                    <span className="truncate opacity-80">{destination.error}</span>
                    <span className="ml-auto shrink-0 opacity-60" aria-hidden="true">
                      Git →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          {canPublish && isEditing && draft.status === "published" ? (
            <button
              type="button"
              onClick={() => handlePublicationChange("draft")}
              disabled={saving || changingStatus || validationErrors.length > 0}
              className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingStatus
                ? "İşleniyor..."
                : hasUnsavedChanges
                  ? "Kaydet ve Yayından Kaldır"
                  : "Yayından Kaldır"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={
              saving ||
              changingStatus ||
              (shouldShowValidationErrors && validationErrors.length > 0) ||
              (isEditing && !hasUnsavedChanges)
            }
            title={
              shouldShowValidationErrors && validationErrors.length > 0
                ? "Kaydetmek için doğrulama hatalarını düzeltin."
                : isEditing && !hasUnsavedChanges
                  ? "Kaydedilecek yeni değişiklik yok."
                  : undefined
            }
            className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:border-[#63978f] hover:bg-[#edf5f3] disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          >
            {saving
              ? "Kaydediliyor..."
              : isEditing
                ? "Değişiklikleri Taslak Olarak Kaydet"
                : "Taslağı Kaydet"}
          </button>
          {canPublish && isEditing ? (
            <button
              type="button"
              onClick={() => handlePublicationChange("published")}
              disabled={saving || changingStatus || validationErrors.length > 0}
              title={
                validationErrors.length > 0
                  ? "Yayınlamak için doğrulama hatalarını düzeltin."
                  : undefined
              }
              className="rounded-xl bg-[#2f423f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              {changingStatus
                ? "Yayınlanıyor..."
                : draft.status === "published"
                  ? "Kaydet ve Yeniden Yayınla"
                  : "Kaydet ve Yayınla"}
            </button>
          ) : null}
        </div>
      </div>
      </fieldset>

      {pendingNavigationHref ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-unsaved-title"
            aria-describedby="page-unsaved-description"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
          >
            <div className="h-1.5 bg-amber-400" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FiAlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
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

              <h2 id="page-unsaved-title" className="mt-4 text-xl font-semibold text-stone-900">
                Kaydedilmemiş değişiklikler var
              </h2>
              <p id="page-unsaved-description" className="mt-3 text-sm leading-6 text-stone-600">
                Bu sayfada yaptığınız değişiklikler henüz kaydedilmedi. Ayrılmadan önce
                taslağı kaydedebilir veya değişiklikleri bırakarak devam edebilirsiniz.
              </p>

              {saveError ? (
                <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {saveError}
                </p>
              ) : null}

              {validationErrors.length > 0 ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  Kaydetmek için önce formdaki doğrulama hatalarını düzeltmelisiniz.
                </p>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleDiscardAndContinueNavigation}
                  disabled={saving}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kaydetmeden devam et
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndContinueNavigation}
                  disabled={saving || validationErrors.length > 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f423f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:opacity-50"
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
