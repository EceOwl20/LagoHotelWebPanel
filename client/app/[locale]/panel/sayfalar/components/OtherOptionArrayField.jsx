import { createPageOtherOption } from "@/lib/pages/schema.mjs";
import EditorField from "./EditorField";
import PageImagePicker from "./PageImagePicker";

const LOCALE_LABELS = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

function updateTranslation(translations, locale, field, value) {
  return {
    ...translations,
    [locale]: {
      ...(translations?.[locale] || {}),
      [field]: value,
    },
  };
}

export default function OtherOptionArrayField({ field, value = [], locale, onChange }) {
  const options = Array.isArray(value) ? value : [];
  const localeLabel = LOCALE_LABELS[locale] || locale.toUpperCase();

  const updateOptions = (updater) => {
    onChange(
      updater(options).map((option, order) => ({
        ...option,
        order,
      }))
    );
  };

  const updateOption = (optionId, updater) => {
    updateOptions((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId ? updater(option) : option
      )
    );
  };

  const updateOptionTranslation = (optionId, fieldName, fieldValue) => {
    updateOption(optionId, (option) => ({
      ...option,
      translations: updateTranslation(
        option.translations,
        locale,
        fieldName,
        fieldValue
      ),
    }));
  };

  const moveOption = (optionIndex, direction) => {
    updateOptions((currentOptions) => {
      const targetIndex = optionIndex + direction;

      if (targetIndex < 0 || targetIndex >= currentOptions.length) {
        return currentOptions;
      }

      const nextOptions = [...currentOptions];
      const [option] = nextOptions.splice(optionIndex, 1);
      nextOptions.splice(targetIndex, 0, option);
      return nextOptions;
    });
  };

  const removeOption = (optionId) => {
    if (!window.confirm("Bu seçenek component alanından çıkarılsın mı?")) {
      return;
    }

    updateOptions((currentOptions) =>
      currentOptions.filter((option) => option.id !== optionId)
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{field.labels.plural}</h3>
          <p className="mt-1 text-xs text-stone-500">Toplam {options.length} seçenek</p>
        </div>
        <button
          type="button"
          onClick={() =>
            updateOptions((currentOptions) => [
              ...currentOptions,
              createPageOtherOption(),
            ])
          }
          className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800"
        >
          + {field.addLabel}
        </button>
      </div>

      {options.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {options.map((option, optionIndex) => {
            const content = option.translations?.[locale] || {};

            return (
              <div
                key={option.id}
                className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-stone-900">
                    {field.labels.singular} {optionIndex + 1}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveOption(optionIndex, -1)}
                      disabled={optionIndex === 0}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                    >
                      Yukarı Taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOption(optionIndex, 1)}
                      disabled={optionIndex === options.length - 1}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                    >
                      Aşağı Taşı
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                    >
                      Seçeneği Çıkar
                    </button>
                  </div>
                </div>

                <PageImagePicker
                  label={`${field.labels.singular} görseli`}
                  value={option.image}
                  onChange={(image) =>
                    updateOption(option.id, (currentOption) => ({
                      ...currentOption,
                      image,
                    }))
                  }
                />
                <EditorField
                  label={`${localeLabel} kart üst başlığı`}
                  value={content.eyebrow}
                  onChange={(nextValue) =>
                    updateOptionTranslation(option.id, "eyebrow", nextValue)
                  }
                />
                <EditorField
                  label={`${localeLabel} kart başlığı`}
                  value={content.title}
                  onChange={(nextValue) =>
                    updateOptionTranslation(option.id, "title", nextValue)
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <EditorField
                    label={`${localeLabel} alan bilgisi`}
                    value={content.size}
                    onChange={(nextValue) =>
                      updateOptionTranslation(option.id, "size", nextValue)
                    }
                  />
                  <EditorField
                    label={`${localeLabel} kapasite bilgisi`}
                    value={content.capacity}
                    onChange={(nextValue) =>
                      updateOptionTranslation(option.id, "capacity", nextValue)
                    }
                  />
                </div>
                <EditorField
                  label={`${localeLabel} kart metni`}
                  value={content.text}
                  onChange={(nextValue) =>
                    updateOptionTranslation(option.id, "text", nextValue)
                  }
                  textarea
                />
                <EditorField
                  label={`${localeLabel} görsel açıklaması (alt)`}
                  value={content.imageAlt}
                  onChange={(nextValue) =>
                    updateOptionTranslation(option.id, "imageAlt", nextValue)
                  }
                />
                <EditorField
                  label={`${localeLabel} buton bağlantısı`}
                  value={content.buttonHref}
                  onChange={(nextValue) =>
                    updateOptionTranslation(option.id, "buttonHref", nextValue)
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-sm text-stone-500">
          Henüz seçenek eklenmedi.
        </div>
      )}
    </div>
  );
}
