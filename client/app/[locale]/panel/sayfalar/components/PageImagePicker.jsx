"use client";

import Image from "next/image";
import { IMAGE_UPLOAD_ACCEPT } from "@/lib/admin/image-upload-policy.mjs";
import { useEffect, useMemo, useState } from "react";

const PICKER_PAGE_SIZE = 80;

function isGif(src) {
  return String(src || "").toLowerCase().split("?")[0].endsWith(".gif");
}

export default function PageImagePicker({
  label,
  value,
  onChange,
  hint,
  allowClear = true,
  uploadFolder = "pages",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [activeFolder, setActiveFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PICKER_PAGE_SIZE);
  const [libraryRequested, setLibraryRequested] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || library || libraryRequested) {
      return;
    }

    const loadLibrary = async () => {
      setLoadingLibrary(true);
      setLibraryRequested(true);
      setError("");

      try {
        const response = await fetch("/api/admin/media", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Medya kütüphanesi alınamadı.");
        }

        setLibrary(payload.library);
        setActiveFolder(
          payload.library?.folders?.includes(uploadFolder) ? uploadFolder : "all"
        );
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoadingLibrary(false);
      }
    };

    loadLibrary();
  }, [isOpen, library, libraryRequested, uploadFolder]);

  useEffect(() => {
    setVisibleCount(PICKER_PAGE_SIZE);
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
      formData.append("folder", uploadFolder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Görsel yüklenemedi.");
      }

      setLibrary(null);
      setLibraryRequested(false);
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
            {value && allowClear ? (
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
                  Medya Kütüphanesinden seçim yapabilir veya yeni bir görsel yükleyebilirsin.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
                  {uploading ? "Yükleniyor..." : "Yeni Görsel Yükle"}
                  <input
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
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

            <div className="grid gap-3 border-b border-stone-200 p-4 md:grid-cols-[minmax(0,1fr)_320px]">
              <label>
                <span className="sr-only">Medya ara</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Dosya adı veya klasör ara..."
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-600 focus:bg-white"
                />
              </label>
              <label>
                <span className="sr-only">Medya klasörü</span>
                <select
                  value={activeFolder}
                  onChange={(event) => setActiveFolder(event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-600 focus:bg-white"
                >
                  <option value="all">Tüm klasörler</option>
                  {(library?.folders || []).map((folder) => (
                    <option key={folder || "root"} value={folder}>
                      {folder || "Ana uploads klasörü"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="overflow-y-auto p-5">
              {error ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <span>{error}</span>
                  {!library ? (
                    <button
                      type="button"
                      onClick={() => setLibraryRequested(false)}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-medium"
                    >
                      Tekrar Dene
                    </button>
                  ) : null}
                </div>
              ) : null}

              {loadingLibrary ? (
                <p className="text-sm text-stone-500">Medya Kütüphanesi yükleniyor...</p>
              ) : filteredAssets.length > 0 ? (
                <>
                  <p className="mb-4 text-sm text-stone-500">
                    {filteredAssets.length} görsel bulundu
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {filteredAssets.slice(0, visibleCount).map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => selectImage(asset.url)}
                      className={`group overflow-hidden rounded-xl border-2 text-left transition ${
                        value === asset.url
                          ? "border-emerald-600 ring-2 ring-emerald-200"
                          : "border-transparent hover:border-stone-400"
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-stone-100">
                        <Image
                          src={asset.url}
                          alt=""
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="object-cover transition group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="space-y-1 px-3 py-2">
                        <div className="truncate text-xs font-medium text-stone-700">
                          {asset.name}
                        </div>
                        <div className="truncate text-[11px] text-stone-400">
                          {asset.folder || "uploads"}
                        </div>
                      </div>
                    </button>
                  ))}
                  </div>
                  {visibleCount < filteredAssets.length ? (
                    <div className="flex justify-center pt-5">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + PICKER_PAGE_SIZE)}
                        className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
                      >
                        Daha fazla göster
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-stone-500">
                  Bu filtrelerle eşleşen görsel bulunamadı.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
