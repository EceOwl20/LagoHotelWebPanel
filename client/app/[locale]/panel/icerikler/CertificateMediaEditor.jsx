"use client";

import { useEffect, useState } from "react";
import PageImagePicker from "../sayfalar/components/PageImagePicker";

const UPLOAD_FOLDER = "pages/certificates";

function createImageId() {
  return globalThis.crypto?.randomUUID
    ? `certificate-${globalThis.crypto.randomUUID()}`
    : `certificate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeOrder(images) {
  return images.map((image, order) => ({ ...image, order }));
}

export default function CertificateMediaEditor() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch("/api/admin/site-pages/certificates", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Sertifika görselleri alınamadı.");
        }

        setContent(payload.content);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const updateSingleImage = (area, image) => {
    setContent((current) => ({
      ...current,
      [area]: { ...current[area], image },
    }));
    setMessage("");
  };

  const updateGallery = (updater) => {
    setContent((current) => ({
      ...current,
      gallery: {
        ...current.gallery,
        images: normalizeOrder(updater(current.gallery.images)),
      },
    }));
    setMessage("");
  };

  const addGalleryImage = (src) => {
    if (!src) {
      return;
    }

    updateGallery((images) => [
      ...images,
      { id: createImageId(), src, order: images.length },
    ]);
  };

  const replaceGalleryImage = (imageId, src) => {
    updateGallery((images) =>
      images.map((image) => (image.id === imageId ? { ...image, src } : image))
    );
  };

  const removeGalleryImage = (imageId) => {
    const approved = window.confirm(
      "Bu görseli sertifika carousel alanından çıkarmak istediğinize emin misiniz? Dosyanın kendisi silinmeyecektir."
    );

    if (!approved) {
      return;
    }

    updateGallery((images) => images.filter((image) => image.id !== imageId));
  };

  const moveGalleryImage = (index, direction) => {
    updateGallery((images) => {
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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/site-pages/certificates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Sertifika görselleri kaydedilemedi.");
      }

      setContent(payload.content);
      setMessage("Sertifika görselleri kaydedildi.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">
        Sertifika görselleri yükleniyor...
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {error || "Sertifika görselleri yüklenemedi."}
      </div>
    );
  }

  return (
    <section className="space-y-6 border-t border-stone-200 pt-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
          Sayfa görselleri
        </div>
        <h2 className="mt-1 text-xl font-semibold text-stone-900">
          Certificates medya alanları
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Görseller tüm dillerde ortak kullanılır. Değişiklikler, aşağıdaki görsel kaydetme
          butonuna basıldıktan sonra yayınlanır.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PageImagePicker
          label="Hero görseli"
          value={content.hero.image}
          onChange={(image) => updateSingleImage("hero", image)}
          allowClear={false}
          uploadFolder={UPLOAD_FOLDER}
        />
        <PageImagePicker
          label="Öne çıkan sertifika görseli"
          value={content.feature.image}
          onChange={(image) => updateSingleImage("feature", image)}
          allowClear={false}
          uploadFolder={UPLOAD_FOLDER}
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-stone-900">Sertifika carousel görselleri</h3>
            <p className="mt-1 text-sm text-stone-500">
              Toplam {content.gallery.images.length} görsel
            </p>
          </div>
        </div>

        {content.gallery.images.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {content.gallery.images.map((image, index) => (
              <div key={image.id} className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
                <PageImagePicker
                  label={`Carousel görseli ${index + 1}`}
                  value={image.src}
                  onChange={(src) => replaceGalleryImage(image.id, src)}
                  allowClear={false}
                  uploadFolder={UPLOAD_FOLDER}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Yukarı Taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, 1)}
                    disabled={index === content.gallery.images.length - 1}
                    className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Aşağı Taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(image.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                  >
                    Carousel’den Çıkar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white p-4 text-sm text-stone-500">
            Carousel alanında henüz görsel yok.
          </p>
        )}

        <PageImagePicker
          label="Carousel’e yeni görsel ekle"
          value=""
          onChange={addGalleryImage}
          allowClear={false}
          uploadFolder={UPLOAD_FOLDER}
          hint="Galeriden seçilen veya yeni yüklenen görsel listenin sonuna eklenir."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Görseller Kaydediliyor..." : "Sertifika Görsellerini Kaydet"}
        </button>
        {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
        {error ? <span className="text-sm text-rose-700">{error}</span> : null}
      </div>
    </section>
  );
}
