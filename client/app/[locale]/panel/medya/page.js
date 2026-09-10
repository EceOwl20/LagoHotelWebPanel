"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiFolder, FiHardDrive, FiImage, FiSearch, FiCheck } from "react-icons/fi";

const PAGE_SIZE = 60;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toLocaleString("tr-TR", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  })} ${units[unitIndex]}`;
}

function folderLabel(folder) {
  return folder || "Sayfa görselleri";
}

export default function MediaLibraryPage() {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [copiedUrl, setCopiedUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLibrary = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/media", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Medya kütüphanesi alınamadı.");
        }

        if (!cancelled) setLibrary(payload.library);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFolder, query]);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr");

    return (library?.assets || []).filter((asset) => {
      if (activeFolder !== "all" && asset.folder !== activeFolder) return false;
      if (!normalizedQuery) return true;

      return `${asset.name} ${asset.folder} ${asset.extension}`
        .toLocaleLowerCase("tr")
        .includes(normalizedQuery);
    });
  }, [activeFolder, library, query]);

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      window.setTimeout(() => setCopiedUrl(""), 1500);
    } catch {
      setError("Görsel yolu panoya kopyalanamadı.");
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
            Medya Kütüphanesi
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Sayfa görselleri
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-[15px]">
            Sayfalarda kullanılan görselleri görüntüleyin, klasörlere göre
            filtreleyin ve ihtiyaç duyduğunuz görsel yolunu kolayca kopyalayın.
            Ziyaretçi galerisi ve blog dosyaları bu alana dahil değildir.
          </p>
        </div>

        {!loading && library ? (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Kütüphane hazır
          </div>
        ) : null}
      </div>
    </header>

    {/* İstatistikler */}
    <section
      aria-label="Medya kütüphanesi özeti"
      className="grid gap-4 sm:grid-cols-3"
    >
      <article className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#63978f]/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500">
              Toplam görsel
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              {library?.total ?? 0}
            </p>
          </div>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#63978f]/10 text-[#507f78] transition group-hover:bg-[#63978f] group-hover:text-white">
            <FiImage className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#63978f] to-[#8bb6af]" />
      </article>

      <article className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#63978f]/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500">
              Medya klasörü
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              {library?.folders?.length ?? 0}
            </p>
          </div>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 transition group-hover:bg-amber-500 group-hover:text-white">
            <FiFolder className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-200" />
      </article>

      <article className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#63978f]/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500">
              Toplam dosya boyutu
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              {formatBytes(library?.totalSize ?? 0)}
            </p>
          </div>

          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 transition group-hover:bg-sky-500 group-hover:text-white">
            <FiHardDrive className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>

        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-sky-400 to-sky-200" />
      </article>
    </section>

    {/* Medya alanı */}
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-stone-200 bg-stone-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Görsellerde ara</span>

            <FiSearch
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Dosya adı, klasör veya uzantı ara..."
              className="w-full rounded-2xl border border-stone-300 bg-white py-3.5 pl-11 pr-4 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
            />
          </label>

          <label className="relative min-w-0 lg:w-80">
            <span className="sr-only">Klasör seçin</span>

            <FiFolder
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />

            <select
              value={activeFolder}
              onChange={(event) => setActiveFolder(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-stone-300 bg-white py-3.5 pl-11 pr-10 text-sm text-stone-900 shadow-sm outline-none transition hover:border-stone-400 focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
            >
              <option value="all">Tüm klasörler</option>

              {(library?.folders || []).map((folder) => (
                <option key={folder || "root"} value={folder}>
                  {folderLabel(folder)}
                </option>
              ))}
            </select>

            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400"
            >
              ▼
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
              {filteredAssets.length} görsel bulundu
            </span>

            {!loading && filteredAssets.length > 0 ? (
              <span className="text-xs text-stone-400">
                {Math.min(visibleCount, filteredAssets.length)} tanesi
                gösteriliyor
              </span>
            ) : null}
          </div>

          {activeFolder !== "all" ? (
            <button
              type="button"
              onClick={() => setActiveFolder("all")}
              className="rounded-lg px-2 py-1 text-sm font-medium text-[#507f78] transition hover:bg-[#63978f]/10"
            >
              Filtreyi temizle
            </button>
          ) : null}
        </div>
      </div>

      {/* İçerik */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <div className="aspect-[4/3] animate-pulse bg-stone-100" />

                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
                  <div className="h-9 animate-pulse rounded-xl bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error && !library ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
          >
            {error}
          </div>
        ) : filteredAssets.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filteredAssets
                .slice(0, visibleCount)
                .map((asset) => {
                  const isCopied = copiedUrl === asset.url;

                  return (
                    <article
                      key={asset.id}
                      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#63978f]/40 hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        <Image
                          src={asset.url}
                          alt=""
                          fill
                          unoptimized
                          sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                          <span className="max-w-[70%] truncate rounded-full bg-stone-950/70 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur">
                            {folderLabel(asset.folder)}
                          </span>

                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600 shadow-sm backdrop-blur">
                            {asset.extension}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </div>

                      <div className="p-4">
                        <p
                          className="truncate text-sm font-semibold text-stone-800"
                          title={asset.name}
                        >
                          {asset.name}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-xs text-stone-400">
                            {formatBytes(asset.size)}
                          </span>

                          <span className="max-w-[65%] truncate font-mono text-[10px] text-stone-400">
                            {asset.extension}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyUrl(asset.url)}
                          aria-label={`${asset.name} görsel yolunu kopyala`}
                          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                            isCopied
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-stone-200 bg-stone-50 text-stone-600 hover:border-[#63978f]/30 hover:bg-[#63978f]/10 hover:text-[#507f78]"
                          }`}
                        >
                          {isCopied ? (
                            <FiCheck
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <FiCopy
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )}

                          {isCopied ? "Yol kopyalandı" : "Görsel yolunu kopyala"}
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>

            {visibleCount < filteredAssets.length ? (
              <div className="mt-7 flex flex-col items-center gap-3 border-t border-stone-100 pt-6">
                <p className="text-xs text-stone-400">
                  {filteredAssets.length - visibleCount} görsel daha bulunuyor
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + PAGE_SIZE)
                  }
                  className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#507f78] hover:shadow-md"
                >
                  Daha fazla göster
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
              <FiImage className="h-6 w-6" aria-hidden="true" />
            </span>

            <p className="mt-4 font-medium text-stone-700">
              Görsel bulunamadı
            </p>

            <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
              Arama ifadenizi veya seçtiğiniz klasör filtresini değiştirerek
              tekrar deneyebilirsiniz.
            </p>
          </div>
        )}

        {error && library ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}
      </div>
    </section>
  </div>
);
}
