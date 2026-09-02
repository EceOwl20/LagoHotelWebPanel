"use client";

import { useEffect, useState } from "react";
import PageImagePicker from "../sayfalar/components/PageImagePicker";

const LOCALES = ["tr", "en", "de", "ru"];

function createImageId(pageKey) {
  return globalThis.crypto?.randomUUID
    ? `${pageKey}-${globalThis.crypto.randomUUID()}`
    : `${pageKey}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTranslations() {
  return LOCALES.reduce((translations, locale) => {
    translations[locale] = { alt: "" };
    return translations;
  }, {});
}

function getAtPath(source, path) {
  return path.reduce((value, key) => value?.[key], source);
}

function setAtPath(source, path, value) {
  const [key, ...rest] = path;

  if (!key) {
    return value;
  }

  return {
    ...source,
    [key]: rest.length > 0 ? setAtPath(source?.[key] || {}, rest, value) : value,
  };
}

function normalizeOrder(images) {
  return images.map((image, order) => ({ ...image, order }));
}

function AltField({ locale, value, onChange }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-700">
        {locale.toUpperCase()} görsel açıklaması (alt)
      </span>
      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        maxLength={300}
        className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-600"
      />
    </label>
  );
}

export default function SitePageMediaEditor({
  pageKey,
  pageTitle,
  activeLocale,
  uploadFolder,
  singleImages,
  collections,
  localizedAlt = false,
}) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/site-pages/${pageKey}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || `${pageTitle} görselleri alınamadı.`);
        }

        if (!cancelled) {
          setContent(payload.content);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [pageKey, pageTitle]);

  const updateValue = (path, updater) => {
    setContent((current) => {
      const value = getAtPath(current, path);
      return setAtPath(current, path, typeof updater === "function" ? updater(value) : updater);
    });
    setMessage("");
  };

  const updateSingleImage = (field, image) => {
    updateValue(field.path, (current) => ({ ...current, image }));
  };

  const updateSingleAlt = (field, alt) => {
    updateValue(field.path, (current) => ({
      ...current,
      translations: {
        ...(current.translations || createTranslations()),
        [activeLocale]: {
          ...(current.translations?.[activeLocale] || {}),
          alt,
        },
      },
    }));
  };

  const updateCollection = (field, updater) => {
    updateValue(field.path, (current) => ({
      ...current,
      images: normalizeOrder(updater(current?.images || [])),
    }));
  };

  const addCollectionImage = (field, src) => {
    if (!src) {
      return;
    }

    updateCollection(field, (images) => [
      ...images,
      {
        id: createImageId(pageKey),
        src,
        order: images.length,
        ...(localizedAlt ? { translations: createTranslations() } : {}),
      },
    ]);
  };

  const updateCollectionImage = (field, imageId, updater) => {
    updateCollection(field, (images) =>
      images.map((image) => (image.id === imageId ? updater(image) : image))
    );
  };

  const moveCollectionImage = (field, index, direction) => {
    updateCollection(field, (images) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= images.length) {
        return images;
      }

      const nextImages = [...images];
      const [image] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, image);
      return nextImages;
    });
  };

  const removeCollectionImage = (field, imageId) => {
    const approved = window.confirm(
      `Bu görseli ${field.label} alanından çıkarmak istediğinize emin misiniz? Dosyanın kendisi silinmeyecektir.`
    );

    if (approved) {
      updateCollection(field, (images) => images.filter((image) => image.id !== imageId));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/site-pages/${pageKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `${pageTitle} görselleri kaydedilemedi.`);
      }

      setContent(payload.content);
      setMessage(`${pageTitle} görselleri kaydedildi.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">
        {pageTitle} görselleri yükleniyor...
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {error || `${pageTitle} görselleri yüklenemedi.`}
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
          Sayfa görselleri
        </div>
        <h2 className="mt-1 text-xl font-semibold text-stone-900">
          {pageTitle} medya alanları
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Görseller tüm dillerde ortak kullanılır.
          {localizedAlt
            ? ` Görsel açıklamaları yukarıda seçili olan ${activeLocale.toUpperCase()} dili için düzenlenir.`
            : ""}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {singleImages.map((field) => {
          const value = getAtPath(content, field.path);

          return (
            <div key={field.path.join(".")} className="space-y-3">
              <PageImagePicker
                label={field.label}
                value={value.image}
                onChange={(image) => updateSingleImage(field, image)}
                allowClear={false}
                uploadFolder={uploadFolder}
              />
              {localizedAlt ? (
                <AltField
                  locale={activeLocale}
                  value={value.translations?.[activeLocale]?.alt}
                  onChange={(alt) => updateSingleAlt(field, alt)}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {collections.map((field) => {
        const collection = getAtPath(content, field.path);
        const images = collection?.images || [];

        return (
          <div
            key={field.path.join(".")}
            className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4"
          >
            <div>
              <h3 className="font-semibold text-stone-900">{field.label}</h3>
              <p className="mt-1 text-sm text-stone-500">Toplam {images.length} görsel</p>
            </div>

            {images.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="space-y-3 rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <PageImagePicker
                      label={`${field.itemLabel} ${index + 1}`}
                      value={image.src}
                      onChange={(src) =>
                        updateCollectionImage(field, image.id, (current) => ({
                          ...current,
                          src,
                        }))
                      }
                      allowClear={false}
                      uploadFolder={uploadFolder}
                    />
                    {localizedAlt ? (
                      <AltField
                        locale={activeLocale}
                        value={image.translations?.[activeLocale]?.alt}
                        onChange={(alt) =>
                          updateCollectionImage(field, image.id, (current) => ({
                            ...current,
                            translations: {
                              ...(current.translations || createTranslations()),
                              [activeLocale]: {
                                ...(current.translations?.[activeLocale] || {}),
                                alt,
                              },
                            },
                          }))
                        }
                      />
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveCollectionImage(field, index, -1)}
                        disabled={index === 0}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Yukarı Taşı
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCollectionImage(field, index, 1)}
                        disabled={index === images.length - 1}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Aşağı Taşı
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCollectionImage(field, image.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      >
                        Görseli Çıkar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-white p-4 text-sm text-stone-500">
                Bu alanda henüz görsel yok.
              </p>
            )}

            <PageImagePicker
              label={`${field.label} alanına yeni görsel ekle`}
              value=""
              onChange={(src) => addCollectionImage(field, src)}
              allowClear={false}
              uploadFolder={uploadFolder}
              hint="Galeriden seçilen veya yeni yüklenen görsel listenin sonuna eklenir."
            />
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Görseller Kaydediliyor..." : `${pageTitle} Görsellerini Kaydet`}
        </button>
        {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
        {error ? <span className="text-sm text-rose-700">{error}</span> : null}
      </div>
    </section>
  );
}
