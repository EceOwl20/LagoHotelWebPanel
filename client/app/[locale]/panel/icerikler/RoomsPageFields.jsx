"use client";

import ObjectEditor from "../components/ObjectEditor";
import PageImagePicker from "../sayfalar/components/PageImagePicker";

const LOCALES = ["tr", "en", "de", "ru"];

function atPath(source, path) {
  return path.reduce((value, key) => value?.[key], source);
}

function withPath(source, path, value) {
  if (!path.length) return value;
  const [key, ...rest] = path;
  return { ...source, [key]: withPath(source?.[key], rest, value) };
}

export function RoomsMediaFields({ media, onChange, activeLocale, cardConfig, disabled,
  externalAssets, externalUpload, externalLoading = false, externalError = "" }) {
  const fields = [
    { path: ["hero"], label: "Odalar hero görseli" },
    ...cardConfig.flatMap(({ key, label }) => [
      { path: ["cards", key, "primary"], label: `${label} birinci görseli` },
      { path: ["cards", key, "secondary"], label: `${label} ikinci görseli` },
    ]),
    { path: ["parallax"], label: "Odalar parallax görseli" },
    ...Object.keys(media?.otherOptions || {}).map((key) => ({
      path: ["otherOptions", key], label: `${key} diğer seçenek görseli`,
    })),
  ];

  function update(path, updater) {
    onChange((current) => withPath(current, path, updater(atPath(current, path))));
  }

  return <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
    <div>
      <h2 className="text-xl font-semibold text-stone-900">Odalar medya alanları</h2>
      <p className="mt-2 text-sm text-stone-500">Görseller ortak; alt açıklama seçili dile aittir. Oda sayısı otele göre değişir.</p>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      {fields.map(({ path, label }) => {
        const image = atPath(media, path);
        if (!image) return null;
        const pathKey = path.join("-");
        return <div key={pathKey} className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <PageImagePicker
            label={label}
            value={image.image}
            onChange={(nextImage) => update(path, (current) => ({ ...current, image: nextImage }))}
            uploadFolder="pages/rooms"
            externalAssets={externalAssets}
            externalPreviewUrl={externalAssets?.find((asset) => asset.image === image.image)?.previewUrl}
            externalUpload={externalUpload ? async (file) => {
              const nextImage = await externalUpload(file);
              if (nextImage) update(path, (current) => ({ ...current, image: nextImage }));
              return nextImage;
            } : undefined}
            externalLoading={externalLoading}
            externalError={externalError}
            uploadAccept="image/jpeg,image/png,image/webp"
            allowClear={false}
            disabled={disabled}
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            {activeLocale.toUpperCase()} görsel açıklaması (alt)
            <input type="text" value={image.translations?.[activeLocale]?.alt || ""} maxLength={300}
              disabled={disabled}
              onChange={(event) => update(path, (current) => ({ ...current, translations: {
                ...current.translations,
                [activeLocale]: { ...current.translations?.[activeLocale], alt: event.target.value },
              } }))}
              className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 disabled:opacity-60" />
          </label>
        </div>;
      })}
    </div>
  </section>;
}

export default function RoomsPageFields({ bundle, onBundleChange, media, onMediaChange,
  activeLocale, cardConfig, disabled, externalAssets, externalUpload, externalLoading, externalError }) {
  if (!bundle || !media) return null;
  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
    <ObjectEditor value={bundle[activeLocale] || {}} onChange={(updater) =>
      onBundleChange((current) => ({ ...current, [activeLocale]: updater(current[activeLocale]) }))} />
    <RoomsMediaFields media={media} onChange={onMediaChange} activeLocale={activeLocale}
      cardConfig={cardConfig} disabled={disabled} externalAssets={externalAssets}
      externalUpload={externalUpload} externalLoading={externalLoading} externalError={externalError} />
  </fieldset>;
}
