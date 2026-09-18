"use client";

import ObjectEditor from "../components/ObjectEditor";
import PageImagePicker from "../sayfalar/components/PageImagePicker";
import { restaurantMediaAtPath } from "@/lib/admin/restaurant-page-fields.mjs";

function replaceAtPath(source, path, value) {
  if (!path.length) return value;
  const [key, ...rest] = path;
  return { ...source, [key]: replaceAtPath(source?.[key], rest, value) };
}

export default function RestaurantsPageFields({
  bundle, onBundleChange, media, onMediaChange, activeLocale, mediaFields,
  disabled, externalAssets, externalUpload, externalLoading = false,
  externalError = "", onMediaError,
}) {
  if (!bundle || !media) return null;
  const isExternal = Array.isArray(externalAssets);

  function updateMedia(path, updater) {
    onMediaChange((current) => replaceAtPath(current, path,
      updater(restaurantMediaAtPath(current, path))));
  }

  function selectImage(path, nextPath, uploadedAsset) {
    const asset = uploadedAsset || externalAssets?.find((item) => item.image === nextPath);
    if (isExternal && (!asset || !Number.isInteger(asset.width) || !Number.isInteger(asset.height))) {
      onMediaError?.("Görselin gerçek ölçüleri bulunamadı; görsel listesini yeniden yükleyin.");
      return false;
    }
    onMediaError?.("");
    updateMedia(path, (current) => ({
      ...current,
      image: nextPath,
      ...(isExternal ? { width: asset.width, height: asset.height } : {}),
    }));
    return true;
  }

  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
    <ObjectEditor value={bundle[activeLocale] || {}} onChange={(updater) =>
      onBundleChange((current) => ({ ...current, [activeLocale]: updater(current[activeLocale]) }))} />
    <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-stone-900">Restoranlar medya alanları</h2>
        <p className="mt-2 text-sm text-stone-500">Görseller tüm dillerde ortak; alt açıklama seçili dile aittir.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {mediaFields.map(({ path, label }) => {
          const record = restaurantMediaAtPath(media, path);
          if (!record) return null;
          return <div key={path.join(".")} className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <PageImagePicker
              label={label} value={record.image} uploadFolder="pages/restaurants"
              onChange={(nextPath) => selectImage(path, nextPath)}
              externalAssets={externalAssets}
              externalPreviewUrl={externalAssets?.find((asset) => asset.image === record.image)?.previewUrl}
              externalUpload={externalUpload ? async (file) => {
                const asset = await externalUpload(file);
                if (!asset || !selectImage(path, asset.image, asset)) return null;
                return asset.image;
              } : undefined}
              externalLoading={externalLoading} externalError={externalError}
              uploadAccept="image/jpeg,image/png,image/webp" allowClear={false} disabled={disabled}
            />
            <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
              {activeLocale.toUpperCase()} görsel açıklaması (alt)
              <input type="text" value={record.translations?.[activeLocale]?.alt || ""} maxLength={300}
                disabled={disabled}
                onChange={(event) => updateMedia(path, (current) => ({
                  ...current,
                  translations: {
                    ...current.translations,
                    [activeLocale]: { ...current.translations?.[activeLocale], alt: event.target.value },
                  },
                }))}
                className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 disabled:opacity-60" />
            </label>
          </div>;
        })}
      </div>
    </section>
  </fieldset>;
}
