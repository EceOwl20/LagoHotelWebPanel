"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import StandardPageTemplate from "../../../_page-template/StandardPageTemplate";
import PageImagePicker from "../components/PageImagePicker";
import {
  PAGE_LOCALES,
  createPageGalleryImage,
  createPageSection,
  createStandardPageDraft,
  validatePageDocument,
} from "@/lib/pages/schema.mjs";

const localeLabels = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

const sectionTypeLabels = {
  intro: "Giriş metni",
  imageText: "Görsel ve metin",
  gallery: "Görsel galerisi",
  carousel: "Görsel carousel",
  callToAction: "Arka plan görselli CTA",
};

const componentLibrary = [
  {
    type: "intro",
    title: "Giriş Metni",
    description: "Ortalanmış üst başlık, başlık ve açıklama metni.",
  },
  {
    type: "imageText",
    title: "Görsel + Metin",
    description: "Görseli sağda veya solda kullanılabilen iki kolonlu içerik.",
  },
  {
    type: "gallery",
    title: "Görsel Galerisi",
    description: "Görsel eklenip çıkarılabilen ve serbestçe kaydırılabilen yatay galeri.",
  },
  {
    type: "carousel",
    title: "Görsel Carousel",
    description: "Döngülü geçiş, yön butonları ve slayt göstergeleri olan görsel alanı.",
  },
  {
    type: "callToAction",
    title: "Arka Plan CTA",
    description: "Arka plan görseli, metin ve aksiyon butonu içeren vurgu alanı.",
  },
];

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

function createEditorDraft() {
  const draft = createStandardPageDraft();
  const starterContent = {
    tr: {
      eyebrow: "Lago Hotel",
      heroTitle: "Yeni Sayfa",
      navigationLabel: "Yeni Sayfa",
      introTitle: "İçerik başlığınızı buraya girin",
      introText: "Yeni sayfanızın giriş metnini bu alanda düzenleyebilirsiniz.",
    },
    en: {
      eyebrow: "Lago Hotel",
      heroTitle: "New Page",
      navigationLabel: "New Page",
      introTitle: "Enter your content title here",
      introText: "You can edit the introductory text of your new page in this area.",
    },
    de: {
      eyebrow: "Lago Hotel",
      heroTitle: "Neue Seite",
      navigationLabel: "Neue Seite",
      introTitle: "Geben Sie hier Ihren Inhaltstitel ein",
      introText: "Hier können Sie den Einführungstext Ihrer neuen Seite bearbeiten.",
    },
    ru: {
      eyebrow: "Lago Hotel",
      heroTitle: "Новая страница",
      navigationLabel: "Новая страница",
      introTitle: "Введите заголовок содержимого",
      introText: "Здесь можно изменить вводный текст новой страницы.",
    },
  };

  PAGE_LOCALES.forEach((locale) => {
    const content = starterContent[locale];
    draft.hero.translations[locale] = {
      ...draft.hero.translations[locale],
      eyebrow: content.eyebrow,
      title: content.heroTitle,
    };
    draft.navigation.translations[locale].label = content.navigationLabel;
    draft.sections[0].translations[locale] = {
      ...draft.sections[0].translations[locale],
      eyebrow: content.eyebrow,
      title: content.introTitle,
      text: content.introText,
    };
  });

  return draft;
}

function Field({ label, value, onChange, textarea = false, hint }) {
  const className =
    "rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-600";

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {textarea ? (
        <textarea
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className={`${className} min-h-[120px] resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
      {hint ? <span className="text-xs leading-5 text-stone-500">{hint}</span> : null}
    </label>
  );
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
  const content = section.translations?.[locale] || {};
  const isImageCollection = ["gallery", "carousel"].includes(section.type);
  const imageCollectionLabel = section.type === "carousel" ? "carousel" : "galeri";

  const updateCollectionImages = (updater) => {
    const images = updater(section.images || []).map((image, order) => ({
      ...image,
      order,
    }));
    onFieldChange("images", images);
  };

  const addCollectionImage = (src) => {
    if (!src) {
      return;
    }

    updateCollectionImages((images) => [
      ...images,
      createPageGalleryImage(src),
    ]);
  };

  const updateCollectionImage = (imageId, updater) => {
    updateCollectionImages((images) =>
      images.map((image) => (image.id === imageId ? updater(image) : image))
    );
  };

  const moveCollectionImage = (imageIndex, direction) => {
    updateCollectionImages((images) => {
      const targetIndex = imageIndex + direction;

      if (targetIndex < 0 || targetIndex >= images.length) {
        return images;
      }

      const nextImages = [...images];
      const [image] = nextImages.splice(imageIndex, 1);
      nextImages.splice(targetIndex, 0, image);
      return nextImages;
    });
  };

  const removeCollectionImage = (imageId) => {
    if (
      !window.confirm(
        `Bu görseli component ${imageCollectionLabel} alanından çıkarmak istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    updateCollectionImages((images) => images.filter((image) => image.id !== imageId));
  };

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="rounded-2xl border border-stone-200 bg-stone-50"
    >
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-stone-900">
        Bölüm {index + 1}: {sectionTypeLabels[section.type] || section.type}
      </summary>
      <div className="grid gap-4 border-t border-stone-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={section.enabled !== false}
              onChange={(event) => onFieldChange("enabled", event.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            Bölümü önizlemede göster
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={index === 0}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Yukarı Taşı
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={index === totalSections - 1}
              className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
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
        {section.type === "imageText" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <PageImagePicker
              label="Bölüm görseli"
              value={section.image}
              onChange={(value) => onFieldChange("image", value)}
              hint="Galeriden bir görsel seçebilir veya JPG, PNG, WEBP ya da GIF yükleyebilirsin."
            />
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Görsel konumu</span>
              <select
                value={section.imagePosition || "left"}
                onChange={(event) => onFieldChange("imagePosition", event.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-600"
              >
                <option value="left">Solda</option>
                <option value="right">Sağda</option>
              </select>
            </label>
          </div>
        ) : null}
        {section.type === "callToAction" ? (
          <div className="space-y-3">
            <PageImagePicker
              label="CTA arka plan görseli"
              value={section.image}
              onChange={(value) => onFieldChange("image", value)}
            />
            <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={section.overlay !== false}
                onChange={(event) => onFieldChange("overlay", event.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              Görselin üzerinde karartma kullan
            </label>
          </div>
        ) : null}
        <Field
          label="Üst başlık"
          value={content.eyebrow}
          onChange={(value) => onTranslationChange("eyebrow", value)}
        />
        <Field
          label="Başlık"
          value={content.title}
          onChange={(value) => onTranslationChange("title", value)}
        />
        <Field
          label="Metin"
          value={content.text}
          onChange={(value) => onTranslationChange("text", value)}
          textarea
        />
        {["imageText", "callToAction"].includes(section.type) ? (
          <>
            <Field
              label="Görsel açıklaması (alt)"
              value={content.imageAlt}
              onChange={(value) => onTranslationChange("imageAlt", value)}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Buton metni"
                value={content.buttonText}
                onChange={(value) => onTranslationChange("buttonText", value)}
              />
              <Field
                label="Buton bağlantısı"
                value={content.buttonHref}
                onChange={(value) => onTranslationChange("buttonHref", value)}
              />
            </div>
          </>
        ) : null}
        {isImageCollection ? (
          <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                {section.type === "carousel" ? "Carousel görselleri" : "Galeri görselleri"}
              </h3>
              <p className="mt-1 text-xs text-stone-500">
                Toplam {(section.images || []).length} görsel
              </p>
            </div>

            {(section.images || []).length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {section.images.map((image, imageIndex) => {
                  const imageContent = image.translations?.[locale] || {};

                  return (
                    <div key={image.id} className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <PageImagePicker
                        label={`${section.type === "carousel" ? "Carousel" : "Galeri"} görseli ${imageIndex + 1}`}
                        value={image.src}
                        onChange={(src) =>
                          updateCollectionImage(image.id, (currentImage) => ({
                            ...currentImage,
                            src,
                          }))
                        }
                        allowClear={false}
                      />
                      <Field
                        label={`${localeLabels[locale]} görsel açıklaması (alt)`}
                        value={imageContent.imageAlt}
                        onChange={(imageAlt) =>
                          updateCollectionImage(image.id, (currentImage) => ({
                            ...currentImage,
                            translations: updateTranslationCollection(
                              currentImage.translations,
                              locale,
                              "imageAlt",
                              imageAlt
                            ),
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveCollectionImage(imageIndex, -1)}
                          disabled={imageIndex === 0}
                          className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                        >
                          Yukarı Taşı
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCollectionImage(imageIndex, 1)}
                          disabled={imageIndex === section.images.length - 1}
                          className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                        >
                          Aşağı Taşı
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCollectionImage(image.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                        >
                          Görseli Çıkar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <PageImagePicker
              label={`${section.type === "carousel" ? "Carousel'e" : "Galeriye"} yeni görsel ekle`}
              value=""
              onChange={addCollectionImage}
              allowClear={false}
              hint="Seçilen görsel listenin sonuna eklenir ve daha sonra sıralanabilir."
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default function NewPageAdminPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = typeof params.id === "string" ? params.id : null;
  const isEditing = Boolean(pageId);
  const [draft, setDraft] = useState(createEditorDraft);
  const [activeLocale, setActiveLocale] = useState("tr");
  const [loadingPage, setLoadingPage] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [lastAddedSectionId, setLastAddedSectionId] = useState(null);
  const validationErrors = useMemo(
    () => validatePageDocument(draft, { allowEmptySlugs: true }),
    [draft]
  );
  const publicationErrors = useMemo(() => validatePageDocument(draft), [draft]);

  useEffect(() => {
    if (!pageId) {
      return;
    }

    let cancelled = false;

    const loadPage = async () => {
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
  }, [pageId]);

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
    const label = sectionTypeLabels[section.type] || section.type;

    if (!window.confirm(`${label} componentini sayfadan kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((item) => item.id !== section.id),
    }));
  };

  const saveDraft = async () => {
    const response = await fetch(pageId ? `/api/admin/pages/${pageId}` : "/api/admin/pages", {
        method: pageId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  if (loadingPage) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
        Sayfa taslağı yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Sayfalar</p>
        <h1 className="text-3xl font-semibold text-stone-900">
          {isEditing ? "Sayfa taslağını düzenle" : "Yeni sayfa hazırla"}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          Dört dildeki sayfa adreslerini ve içerikleri hazırlayabilir, taslak olarak
          saklayabilir ve kontroller tamamlandıktan sonra yayınlayabilirsin.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Taslağı Kaydet butonu içeriği güvenli JSON depolamasına kaydeder. Mevcut
        yayınlanmış bir sayfadaki değişiklikler taslak olarak kaydedilir ve yeniden yayın
        onayı gerektirir.
      </div>

      <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4">
          <PageImagePicker
            label="Hero görseli"
            value={draft.hero.image}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                hero: { ...current.hero, image: value },
              }))
            }
            hint="Bu görsel tüm dillerde ortak kullanılır. Galeriden seçilebilir veya yeni yüklenebilir."
          />
        </div>

        {validationErrors.length > 0 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {validationErrors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        {PAGE_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeLocale === locale
                ? "bg-stone-900 text-white"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {localeLabels[locale]}
          </button>
        ))}
      </div>

      <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
            Aktif dil
          </div>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">
            {localeLabels[activeLocale]} içeriği
          </h2>
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

        <div className="space-y-3 border-t border-stone-200 pt-5">
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

          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            {!showComponentLibrary ? (
              <button
                type="button"
                onClick={() => setShowComponentLibrary(true)}
                className="flex w-full items-center justify-center rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800"
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
                      className="rounded-xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-500 hover:shadow-sm"
                    >
                      <span className="block text-sm font-semibold text-stone-900">
                        {component.title}
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

        <details className="rounded-2xl border border-stone-200 bg-stone-50">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-stone-900">
            SEO alanları
          </summary>
          <div className="grid gap-4 border-t border-stone-200 p-5 lg:grid-cols-2">
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
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Canlı önizleme</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">
            {localeLabels[activeLocale]} görünümü
          </h2>
        </div>
        <StandardPageTemplate page={draft} locale={activeLocale} preview />
        <p className="text-xs leading-5 text-stone-500">
          Panel önizlemesinde iletişim bölümü performans ve ekran alanı için gizlidir;
          yayınlanan standart şablonda görünür olacaktır.
        </p>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-stone-600">
            Kayıt durumu:{" "}
            <span className="font-medium text-stone-900">
              {draft.status === "published" ? "Yayında" : "Taslak"}
            </span>
          </p>
          {saveError ? <p className="mt-2 text-sm text-rose-600">{saveError}</p> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          {isEditing && draft.status === "published" ? (
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
            className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
          >
            {saving
              ? "Kaydediliyor..."
              : isEditing
                ? "Değişiklikleri Taslak Olarak Kaydet"
                : "Taslağı Kaydet"}
          </button>
          {isEditing && draft.status !== "published" ? (
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
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              {changingStatus ? "Yayınlanıyor..." : "Kaydet ve Yayınla"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
