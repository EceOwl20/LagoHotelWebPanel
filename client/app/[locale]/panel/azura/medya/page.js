"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiHardDrive,
  FiImage,
  FiSearch,
} from "react-icons/fi";

const PAGE_SIZE = 60;
const SEARCH_DELAY_MS = 350;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / 1024 ** unitIndex;

  return `${value.toLocaleString("tr-TR", {
    maximumFractionDigits:
      unitIndex === 0 ? 0 : 1,
  })} ${units[unitIndex]}`;
}

function createPreviewUrl(origin, image) {
  if (!origin || !image) {
    return "";
  }

  return `${origin}${image}`;
}

export default function AzuraMediaLibraryPage() {
  const [images, setImages] = useState([]);
  const [total, setTotal] = useState(0);
  const [nextOffset, setNextOffset] =
    useState(null);
  const [mediaOrigin, setMediaOrigin] =
    useState("");

  const [query, setQuery] = useState("");
  const generation = useRef(0);
  const moreRequest = useRef(null);
  const [debouncedQuery, setDebouncedQuery] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [error, setError] = useState("");
  const [copiedPath, setCopiedPath] =
    useState("");

  /*
   * Aramayı her tuş vuruşunda backend'e
   * göndermemek için kısa debounce.
   */
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  /*
   * İlk sayfayı veya yeni aramanın
   * ilk sonuçlarını yükle.
   */
  useEffect(() => {
    let cancelled = false;
    const version = ++generation.current;
    setLoadingMore(false);

    const loadLibrary = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: "0",
        });

        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }

        const response = await fetch(
          `/api/admin/azura/media-library?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error ||
              "Azura medya kütüphanesi alınamadı."
          );
        }

        if (cancelled) {
          return;
        }

        setImages(payload.images || []);
        setTotal(payload.total || 0);
        setNextOffset(
          payload.nextOffset ?? null
        );
        setMediaOrigin(
          payload.mediaOrigin || ""
        );
      } catch (loadError) {
        if (!cancelled) {
          setImages([]);
          setTotal(0);
          setNextOffset(null);

          setError(
            loadError.message ||
              "Azura medya kütüphanesi alınamadı."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLibrary();

    return () => {
      cancelled = true;
      if (generation.current === version) generation.current += 1;
    };
  }, [debouncedQuery]);

  const loadMore = async () => {
    if (
      nextOffset === null ||
      loading || loadingMore || moreRequest.current === generation.current || query.trim() !== debouncedQuery
    ) {
      return;
    }

    setLoadingMore(true);
    const version = generation.current;
    moreRequest.current = version;
    setError("");

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(nextOffset),
      });

      if (debouncedQuery) {
        params.set("q", debouncedQuery);
      }

      const response = await fetch(
        `/api/admin/azura/media-library?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const payload = await response.json();

      if (generation.current !== version) return;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            "Diğer görseller alınamadı."
        );
      }

      setImages((current) => {
        const existing = new Set(
          current.map((image) => image.image)
        );

        const additions = (
          payload.images || []
        ).filter(
          (image) =>
            !existing.has(image.image)
        );

        return [
          ...current,
          ...additions,
        ];
      });

      setTotal(payload.total || 0);

      setNextOffset(
        payload.nextOffset ?? null
      );

      if (payload.mediaOrigin) {
        setMediaOrigin(
          payload.mediaOrigin
        );
      }
    } catch (loadError) {
      if (generation.current !== version) return;
      setError(
        loadError.message ||
          "Diğer görseller alınamadı."
      );
    } finally {
      if (generation.current === version) setLoadingMore(false);
      if (moreRequest.current === version) moreRequest.current = null;
    }
  };

  const copyPath = async (imagePath) => {
    try {
      await navigator.clipboard.writeText(
        imagePath
      );

      setCopiedPath(imagePath);

      window.setTimeout(() => {
        setCopiedPath("");
      }, 1500);
    } catch {
      setError(
        "Görsel yolu panoya kopyalanamadı."
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
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
              <FiImage
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />

              Medya Kütüphanesi
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Azura görselleri
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-[15px]">
              Azura&apos;da kullanılan
              görselleri görüntüleyin,
              arayın ve mevcut görselleri
              tekrar yüklemeden farklı
              içeriklerde kullanın.
            </p>
          </div>

          {!loading && !error ? (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Kütüphane hazır
            </div>
          ) : null}
        </div>
      </header>

      <section
        aria-label="Medya kütüphanesi özeti"
        className="grid gap-4 sm:grid-cols-3"
      >
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">
                Toplam görsel
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
                {total}
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#63978f]/10 text-[#507f78]">
              <FiImage className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">
                Yüklenen kayıt
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
                {images.length}
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FiHardDrive className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-stone-500">
              Sonuç durumu
            </p>

            <p className="mt-3 text-lg font-semibold text-stone-900">
              {nextOffset === null
                ? "Tümü gösteriliyor"
                : "Daha fazla görsel var"}
            </p>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 bg-stone-50/70 p-5 sm:p-6">
          <label className="relative block">
            <span className="sr-only">
              Görsellerde ara
            </span>

            <FiSearch
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              maxLength={100}
              placeholder="Dosya adı veya klasör ara..."
              className="w-full rounded-2xl border border-stone-300 bg-white py-3.5 pl-11 pr-4 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
            />
          </label>

          <div className="mt-4">
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
              {total} görsel bulundu
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from(
                { length: 8 },
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-stone-100" />

                    <div className="space-y-3 p-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : error && images.length === 0 ? (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
            >
              {error}
            </div>
          ) : images.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {images.map((asset) => {
                  const previewUrl =
                    createPreviewUrl(
                      mediaOrigin,
                      asset.image
                    );

                  const isCopied =
                    copiedPath ===
                    asset.image;

                  return (
                    <article
                      key={asset.image}
                      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#63978f]/40 hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        <div
                          role="img"
                          aria-label={
                            asset.name
                          }
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition duration-500 group-hover:scale-105"
                          style={
                            previewUrl
                              ? {
                                  backgroundImage: `url("${previewUrl}")`,
                                }
                              : undefined
                          }
                        />

                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                          <span className="max-w-[70%] truncate rounded-full bg-stone-950/70 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur">
                            {asset.scope}
                          </span>

                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600 shadow-sm backdrop-blur">
                            {asset.mimeType
                              ?.split("/")[1] ||
                              "image"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <p
                          className="truncate text-sm font-semibold text-stone-800"
                          title={asset.name}
                        >
                          {asset.name}
                        </p>

                        <p
                          className="mt-1 truncate text-xs text-stone-400"
                          title={asset.folder}
                        >
                          {asset.folder}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-stone-400">
                            {formatBytes(
                              asset.size
                            )}
                          </span>

                          <span className="text-[10px] text-stone-400">
                            {asset.width} ×{" "}
                            {asset.height}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyPath(
                              asset.image
                            )
                          }
                          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                            isCopied
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-stone-200 bg-stone-50 text-stone-600 hover:border-[#63978f]/30 hover:bg-[#63978f]/10 hover:text-[#507f78]"
                          }`}
                        >
                          {isCopied ? (
                            <FiCheck className="h-3.5 w-3.5" />
                          ) : (
                            <FiCopy className="h-3.5 w-3.5" />
                          )}

                          {isCopied
                            ? "Yol kopyalandı"
                            : "Görsel yolunu kopyala"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {nextOffset !== null ? (
                <div className="mt-7 flex flex-col items-center gap-3 border-t border-stone-100 pt-6">
                  <p className="text-xs text-stone-400">
                    {Math.max(
                      total -
                        images.length,
                      0
                    )}{" "}
                    görsel daha bulunuyor
                  </p>

                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#507f78] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore
                      ? "Yükleniyor..."
                      : "Daha fazla göster"}
                  </button>
                </div>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                <FiImage className="h-6 w-6" />
              </span>

              <p className="mt-4 font-medium text-stone-700">
                Görsel bulunamadı
              </p>

              <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
                Arama ifadenizi değiştirerek
                tekrar deneyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
