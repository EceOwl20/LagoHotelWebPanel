"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [blockingUsages, setBlockingUsages] = useState([]);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteDialogRef = useRef(null);
  const cancelDeleteButtonRef = useRef(null);
  const deleteTriggerRef = useRef(null);
  const deletingRef = useRef(false);

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

  useEffect(() => {
    if (!pendingDelete) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      cancelDeleteButtonRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deletingRef.current) {
        event.preventDefault();
        setPendingDelete(null);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        deleteDialogRef.current?.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        ) || []
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!deleteDialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;

      window.requestAnimationFrame(() => {
        const returnTarget = deleteTriggerRef.current?.isConnected
          ? deleteTriggerRef.current
          : document.querySelector("[data-gallery-delete-button]");

        returnTarget?.focus();
      });
    };
  }, [pendingDelete]);

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

  const handleDelete = (imageId) => {
    const targetImage = currentCategory?.images.find(
      (image) => image.id === imageId
    );

    if (!targetImage) {
      return;
    }

    deleteTriggerRef.current = document.activeElement;
    setPendingDelete({
      imageId,
      categoryId: activeCategory,
      src: targetImage.src,
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) {
      return;
    }

    deletingRef.current = true;
    setDeleting(true);
    setError("");
    setMessage("");
    setBlockingUsages([]);

    try {
      const response = await fetch(
        `/api/admin/gallery?categoryId=${pendingDelete.categoryId}&imageId=${pendingDelete.imageId}`,
        {
          method: "DELETE",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        setBlockingUsages(payload.usages || []);
        throw new Error(payload.error || "Görsel silinemedi.");
      }

      setGallery(payload.gallery);
      setMessage("Görsel silindi.");
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
      setPendingDelete(null);
    } finally {
      deletingRef.current = false;
      setDeleting(false);
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
        <p className="max-w-3xl text-sm text-amber-700">
          Başka bir sayfa, blog veya galeri alanında kullanılan görseller güvenlik için
          silinmez; kullanım yerleri işlem sırasında gösterilir.
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
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            {blockingUsages.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-rose-200 pt-3">
                {blockingUsages.map((usage, index) => (
                  <li key={`${usage.sourceId}-${usage.path}-${index}`}>
                    <span className="font-semibold">{usage.label}</span>
                    {usage.path ? (
                      <span className="ml-2 text-xs text-rose-600">({usage.path})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

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
                        data-gallery-delete-button
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

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setPendingDelete(null);
            }
          }}
        >
          <div
            ref={deleteDialogRef}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div className="p-6">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.3 3.7 2.6 17a2 2 0 0 0 1.73 3h15.34a2 2 0 0 0 1.73-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                    />
                  </svg>
                </div>

                <div>
                  <h2
                    id="delete-dialog-title"
                    className="text-lg font-semibold text-stone-900"
                  >
                    Görseli silmek istediğinize emin misiniz?
                  </h2>

                  <p
                    id="delete-dialog-description"
                    className="mt-2 text-sm leading-6 text-stone-600"
                  >
                    Bu görsel galeriden kaldırılacak. Başka bir alanda
                    kullanılmıyorsa uploads klasöründen de kalıcı olarak
                    silinecektir.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="break-all text-xs leading-5 text-stone-500">
                  {pendingDelete.src}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  ref={cancelDeleteButtonRef}
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={deleting}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Siliniyor..." : "Evet, görseli sil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
