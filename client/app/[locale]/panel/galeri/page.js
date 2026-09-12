"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { usePanelPermission } from "../PanelSessionContext";
import { IMAGE_UPLOAD_ACCEPT } from "@/lib/admin/image-upload-policy.mjs";

import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiCheckCircle,
  FiImage,
  FiShield,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";

const categoryLabels = {
  general: "Genel Görünüm",
  rooms: "Odalar",
  pool: "Havuz ve Plaj",
  flavours: "Lezzetler",
  spa: "Spa",
  kidsclub: "Kids Club",
  entertainment: "Eğlence",
  bar: "Barlar",
  lobby: "Lobi",
  other: "Diğer",
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

//smooth geçiş
function SmoothGalleryImage({ src, children }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div className="relative aspect-[3/2] overflow-hidden bg-stone-100">
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-200/70 to-stone-100 transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "animate-pulse opacity-100"
        }`}
      />

      <Image
        src={src}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        onLoad={() => setIsLoaded(true)}
        className={`object-cover transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
          isLoaded
            ? "scale-100 opacity-100 group-hover:scale-105"
            : "scale-[1.02] opacity-0"
        }`}
      />

      {children}
    </div>
  );
}

export default function GalleryAdminPage() {
  const canDelete = usePanelPermission(PANEL_PERMISSIONS.DELETE_CONTENT);
  const [gallery, setGallery] = useState(null);
  const [activeCategory, setActiveCategory] = useState("general");
  const [uploadCategory, setUploadCategory] = useState("general");
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

  const persistGalleryOrder = async (categoryId, imageIds) => {
    const response = await fetch("/api/admin/gallery", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ categoryId, imageIds }),
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
      const targetCategory = gallery.categories.some(
        (category) => category.id === uploadCategory
      )
        ? uploadCategory
        : "other";

      formData.append("folder", `gallery/${targetCategory}`);

      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadPayload.error || "Dosya yuklenemedi.");
      }

      const galleryResponse = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: targetCategory, src: uploadPayload.url }),
      });
      const galleryPayload = await galleryResponse.json();

      if (!galleryResponse.ok) {
        throw new Error(galleryPayload.error || "Görsel galeriye eklenemedi.");
      }

      setGallery(galleryPayload.gallery);
      setActiveCategory(galleryPayload.categoryId);
      setUploadCategory(galleryPayload.categoryId);
      setMessage(
        `Görsel ${categoryLabels[galleryPayload.categoryId] || galleryPayload.categoryId} kategorisine eklendi.`
      );
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
      const reorderedImages = moveImage(currentCategory.images, index, direction);
      await persistGalleryOrder(
        activeCategory,
        reorderedImages.map((image) => image.id)
      );
    } catch (err) {
      setError(err.message);
    }
  };

 return (
  <div className="mx-auto max-w-[1500px] space-y-6">
    {/* Başlık */}
    <header className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-white via-white to-[#edf5f3] px-6 py-7 shadow-sm sm:px-8 sm:py-9">
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-amber-100/60 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#63978f]/20 bg-[#63978f]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#507f78]">
            <FiImage className="h-3.5 w-3.5" aria-hidden="true" />
            Galeri Yönetimi
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Galeri sekmeleri
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-[15px]">
            Galeri kategorilerine yeni görseller ekleyin, mevcut görsellerin
            sırasını değiştirin ve artık kullanılmayan dosyaları güvenli şekilde
            kaldırın.
          </p>
        </div>

        {gallery ? (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Galeri hazır
          </div>
        ) : null}
      </div>
    </header>

    {/* Güvenlik bilgisi */}
    <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 text-amber-800 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
        <FiShield className="h-4 w-4" aria-hidden="true" />
      </span>

      <div>
        <p className="text-sm font-semibold">Güvenli silme koruması</p>
        <p className="mt-1 text-xs leading-5 text-amber-700">
          Başka bir sayfa, blog veya galeri alanında kullanılan görseller
          silinmez. Görselin kullanım yerleri işlem sırasında size gösterilir.
        </p>
      </div>
    </section>

    {/* Kategori sekmeleri */}
    <nav
      aria-label="Galeri kategorileri"
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
    >
      <div className="flex gap-2 overflow-x-auto p-3">
        {(gallery?.categories || []).map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveCategory(category.id);
                setUploadCategory(category.id);
              }}
              aria-pressed={isActive}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? "bg-[#8bc3ba]" : "bg-stone-300"
                }`}
              />

              {categoryLabels[category.id] || category.id}

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isActive
                    ? "bg-white/10 text-stone-200"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {category.images?.length || 0}
              </span>
            </button>
          );
        })}
      </div>
    </nav>

    {/* Galeri içeriği */}
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      {/* Aktif kategori başlığı */}
      <div className="border-b border-stone-200 bg-stone-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#63978f]/10 text-[#507f78]">
              <FiImage className="h-5 w-5" aria-hidden="true" />
            </span>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">
                Aktif kategori
              </p>

              <h2 className="mt-1 text-xl font-semibold text-stone-900">
                {categoryLabels[activeCategory] || activeCategory}
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                {currentCategory?.images.length || 0} görsel bulunuyor
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
            <label className="flex min-w-52 flex-col gap-1.5 text-xs font-semibold text-stone-600">
              Görsel kategorisi
              <select
                value={uploadCategory}
                onChange={(event) => setUploadCategory(event.target.value)}
                disabled={uploading}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm font-normal text-stone-700 outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10 disabled:opacity-60"
              >
                {(gallery?.categories || []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryLabels[category.id] || category.id}
                  </option>
                ))}
              </select>
            </label>

            <label
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
                uploading
                  ? "cursor-not-allowed bg-stone-400"
                  : "cursor-pointer bg-stone-900 hover:-translate-y-0.5 hover:bg-[#507f78] hover:shadow-md"
              }`}
            >
              <FiUploadCloud className="h-4 w-4" aria-hidden="true" />
              <span>{uploading ? "Görsel yükleniyor..." : "Yeni görsel yükle"}</span>
              <input
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Bildirimler */}
        {message ? (
          <div
            aria-live="polite"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-emerald-700"
          >
            <FiCheckCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{message}</p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <div className="flex items-start gap-3">
              <FiAlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <p className="font-medium">{error}</p>

                {blockingUsages.length > 0 ? (
                  <div className="mt-4 border-t border-rose-200 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-rose-800">
                      Görselin kullanıldığı alanlar
                    </p>

                    <ul className="space-y-2">
                      {blockingUsages.map((usage, index) => (
                        <li
                          key={`${usage.sourceId}-${usage.path}-${index}`}
                          className="rounded-xl border border-rose-200 bg-white/60 px-3 py-2.5"
                        >
                          <span className="font-semibold">{usage.label}</span>

                          {usage.path ? (
                            <span className="mt-1 block break-all font-mono text-[11px] text-rose-600">
                              {usage.path}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Görseller */}
        {currentCategory ? (
          currentCategory.images.length > 0 ? (
            <div
  key={activeCategory}
  className="gallery-category-enter grid gap-5 md:grid-cols-2 xl:grid-cols-3"
>
              {currentCategory.images.map((image, index) => {
                const isFirst = index === 0;
                const isLast =
                  index === currentCategory.images.length - 1;

                return (
                  <article
  key={`${activeCategory}-${image.id}`}
  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#63978f]/40 hover:shadow-lg"
>
                   <div className="relative aspect-[3/2] overflow-hidden bg-stone-100">
  <Image
    src={image.src}
    alt=""
    fill
    unoptimized
    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
    className="object-cover transition-transform duration-500 group-hover:scale-105"
  />

  <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
    <span className="rounded-full bg-stone-950/70 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur">
      Sıra {index + 1}
    </span>

    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-stone-600 shadow-sm backdrop-blur">
      {categoryLabels[activeCategory] || activeCategory}
    </span>
  </div>

  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
</div>

                    <div className="p-4">
                      <p
                        className="truncate font-mono text-[11px] leading-5 text-stone-500"
                        title={image.src}
                      >
                        {image.src}
                      </p>

                      <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleMove(index, -1)}
                          disabled={isFirst}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#63978f]/30 hover:bg-[#63978f]/10 hover:text-[#507f78] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${index + 1}. görseli yukarı taşı`}
                        >
                          <FiArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          Yukarı
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMove(index, 1)}
                          disabled={isLast}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#63978f]/30 hover:bg-[#63978f]/10 hover:text-[#507f78] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`${index + 1}. görseli aşağı taşı`}
                        >
                          <FiArrowDown
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Aşağı
                        </button>

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(image.id)}
                            data-gallery-delete-button
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                            aria-label={`${index + 1}. görseli sil`}
                          >
                            <FiTrash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Sil
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                <FiImage className="h-6 w-6" aria-hidden="true" />
              </span>

              <p className="mt-4 font-medium text-stone-700">
                Bu kategoride henüz görsel yok
              </p>

              <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
                Sağ üstteki “Yeni görsel yükle” butonunu kullanarak bu
                kategoriye ilk görseli ekleyebilirsiniz.
              </p>
            </div>
          )
        ) : error ? null : (
          <div
  key={activeCategory}
  className="gallery-grid-enter grid gap-5 md:grid-cols-2 xl:grid-cols-3"
>
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="aspect-[3/2] animate-pulse bg-stone-100" />

                <div className="space-y-3 p-4">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-stone-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    {/* Silme modalı */}
    {pendingDelete ? (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) {
            setPendingDelete(null);
          }
        }}
      >
        <div
          ref={deleteDialogRef}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <div className="border-b border-stone-100 bg-gradient-to-br from-white to-rose-50 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                  Silme işlemi
                </p>

                <h2
                  id="delete-dialog-title"
                  className="mt-2 text-xl font-semibold text-stone-900"
                >
                  Görseli silmek istediğinize emin misiniz?
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p
              id="delete-dialog-description"
              className="text-sm leading-6 text-stone-600"
            >
              Bu görsel galeriden kaldırılacak. Başka bir alanda
              kullanılmıyorsa uploads klasöründen de kalıcı olarak
              silinecektir.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              <div className="relative aspect-[3/2] bg-stone-100">
                <Image
                  src={pendingDelete.src}
                  alt=""
                  fill
                  unoptimized
                  sizes="448px"
                  className="object-cover"
                />
              </div>

              <p className="break-all border-t border-stone-200 p-3 font-mono text-[11px] leading-5 text-stone-500">
                {pendingDelete.src}
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiTrash2 className="h-4 w-4" aria-hidden="true" />
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
