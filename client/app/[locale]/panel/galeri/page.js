"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const categoryLabels = {
  general: "Genel Gorunum",
  rooms: "Odalar",
  pool: "Havuz ve Plaj",
  flavours: "Lezzetler",
  spa: "Spa",
  kidsclub: "Kids Club",
  entertainment: "Eglence",
  bar: "Barlar",
  lobby: "Lobi",
};

function moveImage(images, index, direction) {
  const targetIndex = index + direction;

  if (targetIndex < 0 || targetIndex >= images.length) {
    return images;
  }

  const nextImages = [...images];
  const [currentImage] = nextImages.splice(index, 1);
  nextImages.splice(targetIndex, 0, currentImage);

  return nextImages.map((image, order) => ({ ...image, order }));
}

export default function GalleryAdminPage() {
  const [gallery, setGallery] = useState(null);
  const [activeCategory, setActiveCategory] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadGallery = async () => {
    const response = await fetch("/api/admin/gallery", { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Galeri verisi alinamadi.");
    }

    setGallery(payload.gallery);
  };

  useEffect(() => {
    loadGallery().catch((err) => setError(err.message));
  }, []);

  const currentCategory = useMemo(
    () => gallery?.categories.find((category) => category.id === activeCategory),
    [activeCategory, gallery]
  );

  const persistGallery = async (nextGallery) => {
    const response = await fetch("/api/admin/gallery", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gallery: nextGallery }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Galeri kaydedilemedi.");
    }

    setGallery(payload.gallery);
    setMessage("Galeri guncellendi.");
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !gallery) {
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `gallery/${activeCategory}`);

      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadPayload.error || "Dosya yuklenemedi.");
      }

      const nextGallery = {
        ...gallery,
        categories: gallery.categories.map((category) =>
          category.id === activeCategory
            ? {
                ...category,
                images: [
                  ...category.images,
                  {
                    id: `${Date.now()}`,
                    src: uploadPayload.url,
                    order: category.images.length,
                  },
                ],
              }
            : category
        ),
      };

      await persistGallery(nextGallery);
      event.target.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/gallery?categoryId=${activeCategory}&imageId=${imageId}`,
        { method: "DELETE" }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gorsel silinemedi.");
      }

      setGallery(payload.gallery);
      setMessage("Gorsel silindi.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMove = async (index, direction) => {
    if (!gallery || !currentCategory) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const nextGallery = {
        ...gallery,
        categories: gallery.categories.map((category) =>
          category.id === activeCategory
            ? {
                ...category,
                images: moveImage(category.images, index, direction),
              }
            : category
        ),
      };

      await persistGallery(nextGallery);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Galeri</p>
        <h1 className="text-3xl font-semibold text-stone-900">Galeri sekmeleri</h1>
        <p className="max-w-3xl text-sm text-stone-600">
          Her sekmeye yeni gorsel ekleyebilir, mevcut gorselleri silebilir ve sirayi
          degistirebilirsin. Yüklenen dosyalar `public/uploads/gallery/...`
          altina kaydedilir.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(gallery?.categories || []).map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeCategory === category.id
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            {categoryLabels[category.id] || category.id}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-stone-900">
              Aktif sekme: {categoryLabels[activeCategory] || activeCategory}
            </div>
            <div className="text-sm text-stone-500">
              Toplam gorsel: {currentCategory?.images.length || 0}
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800">
            <span>{uploading ? "Yukleniyor..." : "Yeni Gorsel Yukle"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {message && <p className="mb-4 text-sm text-emerald-600">{message}</p>}
        {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

        {currentCategory ? (
          currentCategory.images.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentCategory.images.map((image, index) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-2xl border border-stone-200"
                >
                  <Image
                    src={image.src}
                    alt=""
                    width={1200}
                    height={800}
                    unoptimized
                    className="h-56 w-full object-cover"
                  />
                  <div className="space-y-3 p-4">
                    <div className="text-xs text-stone-500">{image.src}</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700"
                      >
                        Yukari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        className="rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-700"
                      >
                        Asagi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(image.id)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">
              Bu sekmede henuz gorsel yok. Yukaridan yeni dosya yukleyebilirsin.
            </p>
          )
        ) : (
          <p className="text-sm text-stone-500">Galeri verisi yukleniyor...</p>
        )}
      </div>
    </div>
  );
}
