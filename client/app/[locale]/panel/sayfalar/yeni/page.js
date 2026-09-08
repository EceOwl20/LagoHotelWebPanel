"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import StandardPageTemplate from "../../../_page-template/StandardPageTemplate";
import BlockDefinitionFields from "../components/BlockDefinitionFields";
import Field from "../components/EditorField";
import PageEditLockNotice from "../components/PageEditLockNotice";
import PageImagePicker from "../components/PageImagePicker";
import usePageEditLock from "../components/usePageEditLock";
import {
  PAGE_LOCALES,
  createPageSection,
  validatePageDocument,
} from "@/lib/pages/schema.mjs";
import {
  PAGE_PRESETS,
  applyPagePresetSections,
  createPageDraftFromPreset,
} from "@/lib/pages/page-presets.mjs";
import {
  getBlockDefinition,
  getBlockDefinitionsForTemplate,
} from "@/lib/pages/block-definitions.mjs";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { usePanelPermission } from "../../PanelSessionContext";
import {
  FiCheckCircle,
  FiChevronDown,
  FiEye,
  FiFileText,
  FiGlobe,
  FiImage,
  FiLayers,
} from "react-icons/fi";

const localeLabels = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

const componentLibrary = getBlockDefinitionsForTemplate("standard");

function updateTranslationCollection(collection, locale, field, value) {
  return {
    ...collection,
    [locale]: {
      ...(collection?.[locale] || {}),
      [field]: value,
    },
  };
}

function normalizeSlugInput(value, locale) {
  return value
    .toLocaleLowerCase(locale)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
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

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition open:border-[#63978f]/50 open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2f423f] text-xs font-semibold text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">
            {getBlockDefinition(section.type)?.label || section.type}
          </span>
          <span className="mt-0.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-stone-400">
            {section.enabled !== false ? "Yayında görünür" : "Gizli component"}
          </span>
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            section.enabled !== false ? "bg-emerald-500" : "bg-stone-300"
          }`}
        />
        <FiChevronDown className="h-4 w-4 text-stone-400 transition group-open:rotate-180" />
      </summary>
      <div className="grid gap-5 border-t border-stone-200 bg-stone-50/70 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={section.enabled !== false}
              onChange={(event) => onFieldChange("enabled", event.target.checked)}
              className="h-4 w-4 rounded border-stone-300 accent-[#63978f]"
            />
            Bölümü önizlemede göster
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 transition hover:border-[#63978f] hover:text-[#2f423f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Yukarı Taşı
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === totalSections - 1}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 transition hover:border-[#63978f] hover:text-[#2f423f] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Aşağı Taşı
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 hover:bg-rose-100"
            >
              Componenti Kaldır
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
  );
}

export default function NewPageAdminPage() {
  const params = useParams();
  const router = useRouter();
  const canPublish = usePanelPermission(PANEL_PERMISSIONS.PUBLISH_CONTENT);
  const canOverrideEditLock = usePanelPermission(PANEL_PERMISSIONS.OVERRIDE_EDIT_LOCK);
  const pageId = typeof params.id === "string" ? params.id : null;
  const isEditing = Boolean(pageId);
  const editLock = usePageEditLock(pageId);
  const [draft, setDraft] = useState(() => createPageDraftFromPreset("editorial"));
  const [activeLocale, setActiveLocale] = useState("tr");
  const [loadingPage, setLoadingPage] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [lastAddedSectionId, setLastAddedSectionId] = useState(null);
  const loadedPageKeyRef = useRef("");
  const validationErrors = useMemo(
    () => validatePageDocument(draft, { allowEmptySlugs: true }),
    [draft]
  );
  const publicationErrors = useMemo(() => validatePageDocument(draft), [draft]);
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
          setDraft(payload.page);
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
  }, [editLock.status, pageId]);

  const applyPreset = (preset) => {
    if (
      !window.confirm(
        `${preset.title} preseti uygulansın mı? Mevcut component düzeni değişecek; slug, hero, header ve SEO alanları korunacak.`
      )
    ) {
      return;
    }

    setDraft((current) => applyPagePresetSections(current, preset.id));
    setLastAddedSectionId(null);
    setShowComponentLibrary(false);
  };

  const updateHeroTranslation = (field, value) => {
    setDraft((current) => ({
      ...current,
      hero: {
        ...current.hero,
        translations: updateTranslationCollection(
          current.hero.translations,
          activeLocale,
          field,
          value
        ),
      },
    }));
  };

  const updateSectionTranslation = (sectionId, field, value) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              translations: updateTranslationCollection(
                section.translations,
                activeLocale,
                field,
                value
              ),
            }
          : section
      ),
    }));
  };

  const updateSectionField = (sectionId, field, value) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    }));
  };

  const moveSection = (index, direction) => {
    setDraft((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.sections.length) {
        return current;
      }

      const sections = [...current.sections];
      const [section] = sections.splice(index, 1);
      sections.splice(targetIndex, 0, section);
      return { ...current, sections };
    });
  };

  const addSection = (type) => {
    const section = createPageSection(type);
    setDraft((current) => ({
      ...current,
      sections: [...current.sections, section],
    }));
    setLastAddedSectionId(section.id);
    setShowComponentLibrary(false);
  };

  const removeSection = (section) => {
    const label = getBlockDefinition(section.type)?.label || section.type;

    if (!window.confirm(`${label} componentini sayfadan kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((item) => item.id !== section.id),
    }));
  };

  const saveDraft = async () => {
    if (isEditing && !editLock.editable) {
      throw new Error("Düzenleme kilidi olmadan bu sayfa kaydedilemez.");
    }

    const response = await fetch(pageId ? `/api/admin/pages/${pageId}` : "/api/admin/pages", {
        method: pageId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isEditing ? { "X-Panel-Edit-Lock": editLock.lockToken } : {}),
        },
        body: JSON.stringify({ page: draft }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Sayfa taslağı kaydedilemedi.");
    }

    return payload.page;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    try {
      await saveDraft();

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
      if (status === "published") {
        await saveDraft();
      }

      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Panel-Edit-Lock": editLock.lockToken,
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Sayfanın yayın durumu değiştirilemedi.");
      }

      setDraft(payload.page);
      router.push("/panel/sayfalar");
      router.refresh();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setChangingStatus(false);
    }
  };

  const activeHero = draft.hero.translations[activeLocale];
  const activeNavigation = draft.navigation.translations[activeLocale];
  const activeSeo = draft.seo[activeLocale];

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
      <header className="relative overflow-hidden rounded-3xl bg-[#2f423f] px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">
              Sayfalar / İçerik oluşturucu
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {isEditing ? "Sayfa taslağını düzenle" : "Yeni sayfa hazırla"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">
              Sayfa yapısını, dört dildeki içerikleri ve yayın ayarlarını tek bir
              çalışma alanından düzenleyin.
            </p>
            {isEditing ? (
              <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#b9d6d1]">
                  <FiFileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a9c9c4]">
                    Düzenlenen sayfa
                  </span>
                  <span className="mt-0.2 block truncate text-xs font-semibold text-white md:text-sm">
                    {editingPageTitle}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <FiLayers className="h-4 w-4 text-[#a9c9c4]" />
              {draft.sections.length} component
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <FiGlobe className="h-4 w-4 text-[#a9c9c4]" />
              4 dil
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              {draft.status === "published" ? "Yayında" : "Taslak"}
            </span>
          </div>
        </div>
      </header>

      <PageEditLockNotice
        status={editLock.status}
        lock={editLock.lock}
        error={editLock.error}
        canOverride={canOverrideEditLock}
        onRetry={editLock.retry}
        onTakeover={handleLockTakeover}
      />

      <fieldset
        disabled={isEditing && !editLock.editable}
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

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-5 md:px-7">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#63978f] text-white">
            <FiImage className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#507f78]">
              Sayfa medyası
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">Hero görünümü</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              Sayfanın en üstünde kullanılacak ortak görseli belirleyin.
            </p>
          </div>
        </div>
        <div className="grid gap-5 p-6 md:p-7">
          <PageImagePicker
            label="Hero görseli"
            value={draft.hero.image}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                hero: { ...current.hero, image: value },
              }))
            }
            hint="Bu görsel tüm dillerde ortak kullanılır. Medya Kütüphanesinden seçilebilir veya yeni yüklenebilir."
          />
        </div>

        {validationErrors.length > 0 ? (
          <div className="mx-6 mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 md:mx-7">
            {validationErrors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
        {PAGE_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition sm:flex-none sm:min-w-28 ${
              activeLocale === locale
                ? "bg-[#2f423f] text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {localeLabels[locale]}
          </button>
        ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-stone-200 bg-[#edf5f3]/70 px-6 py-5 md:px-7">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2f423f] text-white">
            <FiGlobe className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#507f78]">
              Aktif dil · {activeLocale.toUpperCase()}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">
              {localeLabels[activeLocale]} içeriği
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              Adres, navigasyon, hero metinleri ve component içeriklerini düzenleyin.
            </p>
          </div>
        </div>

        <div className="space-y-8 p-6 md:p-7">
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <FiGlobe className="h-4 w-4 text-[#507f78]" />
            <h3 className="text-sm font-semibold text-stone-900">Adres ve navigasyon</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label={`${localeLabels[activeLocale]} sayfa adresi (slug)`}
            value={draft.slugs[activeLocale]}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                slugs: {
                  ...current.slugs,
                  [activeLocale]: normalizeSlugInput(value, activeLocale),
                },
              }))
            }
            hint={
              draft.slugs[activeLocale]
                ? `Örnek adres: /${activeLocale}/${draft.slugs[activeLocale]}`
                : "Her dil için ayrı ve benzersiz bir adres girilebilir."
            }
          />
          <Field
            label="Menü etiketi"
            value={activeNavigation.label}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                navigation: {
                  ...current.navigation,
                  translations: updateTranslationCollection(
                    current.navigation.translations,
                    activeLocale,
                    "label",
                    value
                  ),
                },
              }))
            }
          />
          <div className="grid gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2 lg:col-span-2">
            <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={draft.navigation.visible !== false}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    navigation: {
                      ...current.navigation,
                      visible: event.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-stone-300"
              />
              Yayınlandığında header menüsünde göster
            </label>
            <label className="flex items-center justify-between gap-3 text-sm font-medium text-stone-700">
              Menü sırası
              <input
                type="number"
                min="0"
                value={draft.navigation.order ?? 100}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    navigation: {
                      ...current.navigation,
                      order: Number(event.target.value || 0),
                    },
                  }))
                }
                className="w-28 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-600"
              />
            </label>
          </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <FiImage className="h-4 w-4 text-[#507f78]" />
            <h3 className="text-sm font-semibold text-stone-900">Hero metinleri</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Hero üst başlığı"
            value={activeHero.eyebrow}
            onChange={(value) => updateHeroTranslation("eyebrow", value)}
          />
          <Field
            label="Hero başlığı"
            value={activeHero.title}
            onChange={(value) => updateHeroTranslation("title", value)}
          />
          <Field
            label="Hero görsel açıklaması (alt)"
            value={activeHero.imageAlt}
            onChange={(value) => updateHeroTranslation("imageAlt", value)}
          />
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiLayers className="h-4 w-4 text-[#507f78]" />
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Sayfa akışı</h3>
                <p className="mt-1 text-xs text-stone-500">
                  Componentleri açarak düzenleyin veya sıralarını değiştirin.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#edf5f3] px-3 py-1.5 text-xs font-semibold text-[#507f78]">
              {draft.sections.length} bölüm
            </span>
          </div>
          <div className="space-y-4">
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

          <div className="rounded-2xl border border-dashed border-[#63978f]/60 bg-white p-4">
            {!showComponentLibrary ? (
              <button
                type="button"
                onClick={() => setShowComponentLibrary(true)}
                className="mx-auto flex w-full items-center justify-center rounded-xl bg-[#2f423f] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#3c5551] sm:w-auto sm:min-w-64"
              >
                + Component Ekle
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-stone-900">Component kütüphanesi</h3>
                    <p className="mt-1 text-xs text-stone-500">
                      Seçilen component sayfanın en altına eklenir ve daha sonra taşınabilir.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComponentLibrary(false)}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700"
                  >
                    Kapat
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {componentLibrary.map((component) => (
                    <button
                      key={component.type}
                      type="button"
                      onClick={() => addSection(component.type)}
                      className="rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#63978f] hover:shadow-md"
                    >
                      <span className="block text-sm font-semibold text-stone-900">
                        {component.libraryTitle}
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-stone-500">
                        {component.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        <details className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
            <FiFileText className="h-4 w-4 text-[#507f78]" />
            <span className="flex-1">SEO alanları</span>
            <span className="text-xs font-normal text-stone-400">İsteğe bağlı</span>
            <FiChevronDown className="h-4 w-4 text-stone-400 transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-4 border-t border-stone-200 bg-stone-50/70 p-5 lg:grid-cols-2">
            <Field
              label="SEO başlığı"
              value={activeSeo.title}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  seo: updateTranslationCollection(current.seo, activeLocale, "title", value),
                }))
              }
            />
            <Field
              label="SEO açıklaması"
              value={activeSeo.description}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  seo: updateTranslationCollection(
                    current.seo,
                    activeLocale,
                    "description",
                    value
                  ),
                }))
              }
              textarea
            />
          </div>
        </details>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-stone-200 bg-stone-50/80 px-6 py-5 md:px-7">
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
        <div className="bg-stone-100 p-3 md:p-6">
          <div className="overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-stone-200">
            <StandardPageTemplate page={draft} locale={activeLocale} preview />
          </div>
          <p className="mt-4 px-1 text-xs leading-5 text-stone-500">
            Panel önizlemesinde iletişim bölümü performans ve ekran alanı için gizlidir;
            yayınlanan standart şablonda görünür olacaktır.
          </p>
        </div>
      </section>

      <div className="sticky bottom-4 z-20 flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:p-5">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${draft.status === "published" ? "bg-emerald-500" : "bg-amber-400"}`} />
          <div>
          <p className="text-sm text-stone-600">
            Kayıt durumu:{" "}
            <span className="font-medium text-stone-900">
              {draft.status === "published"
                ? draft.hasUnpublishedChanges
                  ? "Yayında · Yayınlanmamış değişiklik var"
                  : "Yayında"
                : "Taslak"}
            </span>
          </p>
          {saveError ? <p className="mt-2 text-sm text-rose-600">{saveError}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          {canPublish && isEditing && draft.status === "published" ? (
            <button
              type="button"
              onClick={() => handlePublicationChange("draft")}
              disabled={saving || changingStatus}
              className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingStatus ? "İşleniyor..." : "Yayından Kaldır"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || changingStatus || validationErrors.length > 0}
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
              disabled={
                saving || changingStatus || validationErrors.length > 0 || publicationErrors.length > 0
              }
              title={
                publicationErrors.length > 0
                  ? "Yayınlamak için dört dildeki slug alanlarını doldurun."
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
    </div>
  );
}
