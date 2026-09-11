"use client";

import { FiChevronDown, FiFileText, FiGlobe, FiImage } from "react-icons/fi";
import { PAGE_LOCALES } from "@/lib/pages/schema.mjs";
import { PAGE_DRAFT_ACTIONS } from "@/lib/pages/page-draft-reducer.mjs";
import Field from "./EditorField";
import PageImagePicker from "./PageImagePicker";

function normalizeSlugInput(value, locale) {
  return value
    .toLocaleLowerCase(locale)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PageSettingsEditor({
  draft,
  activeLocale,
  localeLabels,
  onActiveLocaleChange,
  onDraftChange,
  children,
}) {
  const activeHero = draft.hero.translations[activeLocale];
  const activeNavigation = draft.navigation.translations[activeLocale];
  const activeSeo = draft.seo[activeLocale];

  const updateHeroTranslation = (field, value) => {
    onDraftChange({
      type: PAGE_DRAFT_ACTIONS.UPDATE_HERO_TRANSLATION,
      locale: activeLocale,
      field,
      value,
    });
  };

  return (
    <>
      <section
        data-validation-target="page-settings"
        className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
      >
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
              onDraftChange({ type: PAGE_DRAFT_ACTIONS.SET_HERO_IMAGE, value })
            }
            hint="Bu görsel tüm dillerde ortak kullanılır. Medya Kütüphanesinden seçilebilir veya yeni yüklenebilir."
          />
        </div>
      </section>

      <div className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {PAGE_LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => onActiveLocaleChange(locale)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition sm:min-w-28 sm:flex-none ${
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
              <h3 className="text-sm font-semibold text-stone-900">
                Adres ve navigasyon
              </h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div data-validation-target={`slug-${activeLocale}`}>
                <Field
                  label={`${localeLabels[activeLocale]} sayfa adresi (slug)`}
                  value={draft.slugs[activeLocale]}
                  onChange={(value) =>
                    onDraftChange({
                      type: PAGE_DRAFT_ACTIONS.SET_SLUG,
                      locale: activeLocale,
                      value: normalizeSlugInput(value, activeLocale),
                    })
                  }
                  hint={
                    draft.slugs[activeLocale]
                      ? `Örnek adres: /${activeLocale}/${draft.slugs[activeLocale]}`
                      : "Her dil için ayrı ve benzersiz bir adres girilebilir."
                  }
                />
              </div>
              <Field
                label="Menü etiketi"
                value={activeNavigation.label}
                onChange={(value) =>
                  onDraftChange({
                    type: PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_TRANSLATION,
                    locale: activeLocale,
                    field: "label",
                    value,
                  })
                }
              />
              <div className="grid gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2 lg:col-span-2">
                <label className="flex items-center gap-3 text-sm font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={draft.navigation.visible !== false}
                    onChange={(event) =>
                      onDraftChange({
                        type: PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_FIELD,
                        field: "visible",
                        value: event.target.checked,
                      })
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
                      onDraftChange({
                        type: PAGE_DRAFT_ACTIONS.UPDATE_NAVIGATION_FIELD,
                        field: "order",
                        value: Number(event.target.value || 0),
                      })
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

          {children}

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
                  onDraftChange({
                    type: PAGE_DRAFT_ACTIONS.UPDATE_SEO_TRANSLATION,
                    locale: activeLocale,
                    field: "title",
                    value,
                  })
                }
              />
              <Field
                label="SEO açıklaması"
                value={activeSeo.description}
                onChange={(value) =>
                  onDraftChange({
                    type: PAGE_DRAFT_ACTIONS.UPDATE_SEO_TRANSLATION,
                    locale: activeLocale,
                    field: "description",
                    value,
                  })
                }
                textarea
              />
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
