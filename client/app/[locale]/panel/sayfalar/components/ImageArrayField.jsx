import { createPageGalleryImage } from "@/lib/pages/schema.mjs";
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

export default function ImageArrayField({ field, value = [], locale, onChange }) {
  const images = Array.isArray(value) ? value : [];

  const updateImages = (updater) => {
    onChange(
      updater(images).map((image, order) => ({
        ...image,
        order,
      }))
    );
  };

  const updateImage = (imageId, updater) => {
    updateImages((currentImages) =>
      currentImages.map((image) => (image.id === imageId ? updater(image) : image))
    );
  };

  const addImage = (src) => {
    if (src) {
      updateImages((currentImages) => [...currentImages, createPageGalleryImage(src)]);
    }
  };

  const moveImage = (imageIndex, direction) => {
    updateImages((currentImages) => {
      const targetIndex = imageIndex + direction;

      if (targetIndex < 0 || targetIndex >= currentImages.length) {
        return currentImages;
      }

      const nextImages = [...currentImages];
      const [image] = nextImages.splice(imageIndex, 1);
      nextImages.splice(targetIndex, 0, image);
      return nextImages;
    });
  };

  const removeImage = (imageId) => {
    if (
      !window.confirm(
        `Bu ${field.labels.singular.toLocaleLowerCase("tr-TR")} component alanından çıkarılsın mı?`
      )
    ) {
      return;
    }

    updateImages((currentImages) => currentImages.filter((image) => image.id !== imageId));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-900">{field.labels.plural}</h3>
        <p className="mt-1 text-xs text-stone-500">Toplam {images.length} görsel</p>
      </div>

      {images.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {images.map((image, imageIndex) => {
            const imageContent = image.translations?.[locale] || {};

            return (
              <div
                key={image.id}
                className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3"
              >
                <PageImagePicker
                  label={`${field.labels.singular} ${imageIndex + 1}`}
                  value={image.src}
                  onChange={(src) =>
                    updateImage(image.id, (currentImage) => ({ ...currentImage, src }))
                  }
                  allowClear={false}
                />
                <EditorField
                  label={`${LOCALE_LABELS[locale] || locale.toUpperCase()} görsel açıklaması (alt)`}
                  value={imageContent.imageAlt}
                  onChange={(imageAlt) =>
                    updateImage(image.id, (currentImage) => ({
                      ...currentImage,
                      translations: updateTranslation(
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
                    onClick={() => moveImage(imageIndex, -1)}
                    disabled={imageIndex === 0}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                  >
                    Yukarı Taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(imageIndex, 1)}
                    disabled={imageIndex === images.length - 1}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700 disabled:opacity-40"
                  >
                    Aşağı Taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
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
        label={field.addLabel}
        value=""
        onChange={addImage}
        allowClear={false}
        hint="Seçilen görsel listenin sonuna eklenir ve daha sonra sıralanabilir."
      />
    </div>
  );
}
