"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const CATEGORY_LABELS = {
  general: "Genel Görünüm",
  rooms: "Odalar",
  pool: "Havuz ve Plaj",
  flavours: "Lezzetler",
  spa: "Spa",
  kidsclub: "Kids Club",
  entertainment: "Eğlence",
  bar: "Barlar",
  lobby: "Lobi",
};

function isGif(src) {
  return String(src || "").toLowerCase().split("?")[0].endsWith(".gif");
}

export default function PageImagePicker({ label, value, onChange, hint }) {
  const [isOpen, setIsOpen] = useState(false);
  const [gallery, setGallery] = useState(null);
  const [activeCategory, setActiveCategory] = useState("general");
  const [galleryRequested, setGalleryRequested] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || gallery || galleryRequested) {
      return;
    }

    const loadGallery = async () => {
      setLoadingGallery(true);
      setGalleryRequested(true);
      setError("");

      try {
        const response = await fetch("/api/admin/gallery", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Galeri görselleri alınamadı.");
        }

        setGallery(payload.gallery);
        const firstCategory = payload.gallery?.categories?.[0]?.id;

        if (firstCategory) {
          setActiveCategory(firstCategory);
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoadingGallery(false);
      }
    };

    loadGallery();
  }, [gallery, galleryRequested, isOpen]);

  const currentCategory = useMemo(
    () => gallery?.categories?.find((category) => category.id === activeCategory),
    [activeCategory, gallery]
  );

  const selectImage = (src) => {
    onChange(src);
    setError("");
    setIsOpen(false);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "pages");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Görsel yüklenemedi.");
      }

      selectImage(payload.url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-stone-700">{label}</div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
        {value ? (
          <div className="relative h-32 w-full bg-stone-200 md:h-36">
            <Image
              src={value}
              alt="Seçili görsel önizlemesi"
              fill
              unoptimized={isGif(value)}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-sm text-stone-500 md:h-24">
            Henüz görsel seçilmedi
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white p-3">
          <div className="min-w-0 flex-1 truncate text-xs text-stone-500">
            {value || "Görsel yolu oluşmadı"}
          </div>
          <div className="flex flex-wrap gap-2">
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
              >
                Görseli Kaldır
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
            >
              Görsel Seç veya Yükle
            </button>
          </div>
        </div>
      </div>
      {hint ? <div className="text-xs leading-5 text-stone-500">{hint}</div> : null}

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} seçimi`}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-stone-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-stone-900">{label}</h3>
                <p className="mt-1 text-sm text-stone-500">
                  Galeriden seçim yapabilir veya yeni bir görsel yükleyebilirsin.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                  {uploading ? "Yükleniyor..." : "Yeni Görsel Yükle"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={uploading}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-stone-200 p-4">
              {(gallery?.categories || []).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    activeCategory === category.id
                      ? "bg-stone-900 text-white"
                      : "border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {CATEGORY_LABELS[category.id] || category.id} ({category.images.length})
                </button>
              ))}
            </div>

            <div className="overflow-y-auto p-5">
              {error ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <span>{error}</span>
                  {!gallery ? (
                    <button
                      type="button"
                      onClick={() => setGalleryRequested(false)}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium"
                    >
                      Tekrar Dene
                    </button>
                  ) : null}
                </div>
              ) : null}

              {loadingGallery ? (
                <p className="text-sm text-stone-500">Galeri yükleniyor...</p>
              ) : currentCategory?.images?.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {currentCategory.images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => selectImage(image.src)}
                      className={`group overflow-hidden rounded-xl border-2 text-left transition ${
                        value === image.src
                          ? "border-emerald-600 ring-2 ring-emerald-200"
                          : "border-transparent hover:border-stone-400"
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-stone-100">
                        <Image
                          src={image.src}
                          alt=""
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover transition group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="truncate px-3 py-2 text-xs text-stone-500">
                        {image.src}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Bu galeri kategorisinde görsel yok.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
