"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiFolder, FiHardDrive, FiImage, FiSearch } from "react-icons/fi";

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
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Medya Kütüphanesi
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">Sayfa görselleri</h1>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          Yalnızca sayfalarda kullanılan görselleri tek yerde görüntüleyin. Ziyaretçi
          galerisindeki ve blog alanındaki dosyalar bu kütüphaneye dahil edilmez.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <FiImage className="h-5 w-5 text-[#63978f]" aria-hidden="true" />
          <p className="mt-4 text-2xl font-semibold text-stone-900">{library?.total || 0}</p>
          <p className="mt-1 text-sm text-stone-500">Toplam görsel</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <FiFolder className="h-5 w-5 text-[#63978f]" aria-hidden="true" />
          <p className="mt-4 text-2xl font-semibold text-stone-900">
            {library?.folders?.length || 0}
          </p>
          <p className="mt-1 text-sm text-stone-500">Medya klasörü</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <FiHardDrive className="h-5 w-5 text-[#63978f]" aria-hidden="true" />
          <p className="mt-4 text-2xl font-semibold text-stone-900">
            {formatBytes(library?.totalSize || 0)}
          </p>
          <p className="mt-1 text-sm text-stone-500">Toplam dosya boyutu</p>
        </div>
      </div>

      <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Görsellerde ara</span>
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Dosya adı, klasör veya uzantı ara..."
              className="w-full rounded-xl border border-stone-300 bg-stone-50 py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition focus:border-stone-600 focus:bg-white"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 lg:w-80">
            <span className="sr-only">Klasör seçin</span>
            <select
              value={activeFolder}
              onChange={(event) => setActiveFolder(event.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-600 focus:bg-white"
            >
              <option value="all">Tüm klasörler</option>
              {(library?.folders || []).map((folder) => (
                <option key={folder || "root"} value={folder}>
                  {folderLabel(folder)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-4">
          <p className="text-sm text-stone-500">
            {filteredAssets.length} görsel bulundu
          </p>
          {activeFolder !== "all" ? (
            <button
              type="button"
              onClick={() => setActiveFolder("all")}
              className="text-sm font-medium text-[#507f78] hover:underline"
            >
              Filtreyi temizle
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-2xl bg-stone-100" />
            ))}
          </div>
        ) : error && !library ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </p>
        ) : filteredAssets.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.slice(0, visibleCount).map((asset) => (
                <article
                  key={asset.id}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <Image
                      src={asset.url}
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <p className="truncate text-sm font-medium text-stone-800" title={asset.name}>
                        {asset.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-stone-500" title={asset.folder}>
                        {folderLabel(asset.folder)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                      <span className="text-[11px] uppercase tracking-wide text-stone-400">
                        {asset.extension} · {formatBytes(asset.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyUrl(asset.url)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
                        aria-label={`${asset.name} görsel yolunu kopyala`}
                      >
                        <FiCopy className="h-3.5 w-3.5" aria-hidden="true" />
                        {copiedUrl === asset.url ? "Kopyalandı" : "Yolu kopyala"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {visibleCount < filteredAssets.length ? (
              <div className="flex justify-center border-t border-stone-100 pt-5">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Daha fazla göster
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">
            Bu filtrelerle eşleşen görsel bulunamadı.
          </p>
        )}

        {error && library ? (
          <p role="alert" className="text-sm text-rose-700">{error}</p>
        ) : null}
      </section>
    </div>
  );
}
