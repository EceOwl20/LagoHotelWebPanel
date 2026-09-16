"use client";

import { useEffect, useMemo, useState } from "react";
import { FiImage, FiSearch, FiUploadCloud, FiX } from "react-icons/fi";

const PAGE_SIZE = 80;

export default function AzuraImagePicker({
  label,
  value,
  images,
  loading,
  error,
  disabled,
  uploading,
  onChange,
  onUpload,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !uploading) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, uploading]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query]);

  const selected = images.find((image) => image.image === value);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("tr");
    return search
      ? images.filter((image) => image.image.toLocaleLowerCase("tr").includes(search))
      : images;
  }, [images, query]);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const newPath = await onUpload(file);
    if (newPath) setOpen(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-700">{label}</p>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row">
          <div
            role="img"
            aria-label={`${label} önizlemesi`}
            className="flex aspect-[4/3] w-full shrink-0 items-center justify-center bg-stone-100 bg-contain bg-center bg-no-repeat text-stone-400 sm:w-56"
            style={selected ? { backgroundImage: `url("${selected.previewUrl}")` } : undefined}
          >
            {!selected && <FiImage className="h-8 w-8" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 border-t border-stone-200 p-4 sm:border-l sm:border-t-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#507f78]">Seçili görsel</p>
              <p className="mt-2 break-all text-xs leading-5 text-stone-500">{value || "Henüz görsel seçilmedi"}</p>
              {selected && <p className="mt-1 text-xs text-stone-400">{selected.width} × {selected.height} piksel</p>}
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={disabled}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#2f423f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <FiImage className="h-4 w-4" />
              Görseli Değiştir
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} seçimi`}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !uploading) setOpen(false);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#507f78]">Azura medya kütüphanesi</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900">{label} seçimi</h3>
                <p className="mt-1 text-sm text-stone-500">Azura’daki görsellerden seçin veya bilgisayarınızdan yeni bir görsel yükleyin.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${uploading || disabled ? "cursor-not-allowed bg-stone-400" : "cursor-pointer bg-emerald-700 hover:bg-emerald-800"}`}>
                  <FiUploadCloud className="h-4 w-4" />
                  {uploading ? "Yükleniyor..." : "Yeni Görsel Yükle"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={upload}
                    disabled={uploading || disabled}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={uploading}
                  aria-label="Pencereyi kapat"
                  className="rounded-xl border border-stone-300 p-2.5 text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="border-b border-stone-200 p-4">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Azura görsellerinde ara..."
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 outline-none focus:border-[#63978f] focus:bg-white"
                />
              </div>
            </div>
            <div className="overflow-y-auto p-5">
              {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
              {loading ? (
                <p className="text-sm text-stone-500">Azura görselleri yükleniyor...</p>
              ) : filtered.length ? (
                <>
                  <p className="mb-4 text-sm text-stone-500">{filtered.length} görsel bulundu · JPEG, PNG ve WebP</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {filtered.slice(0, visibleCount).map((image) => (
                      <button
                        key={image.image}
                        type="button"
                        onClick={() => { onChange(image.image); setOpen(false); }}
                        disabled={disabled || uploading}
                        className={`group overflow-hidden rounded-xl border-2 text-left transition ${value === image.image ? "border-emerald-600 ring-2 ring-emerald-200" : "border-transparent hover:border-stone-400"}`}
                      >
                        <div
                          role="img"
                          aria-label={image.image.split("/").pop()}
                          className="aspect-[4/3] bg-stone-100 bg-cover bg-center bg-no-repeat"
                          style={{ backgroundImage: `url("${image.previewUrl}")` }}
                        />
                        <div className="space-y-1 px-3 py-2">
                          <p className="truncate text-xs font-medium text-stone-700">{image.image.split("/").pop()}</p>
                          <p className="text-[11px] text-stone-400">{image.width} × {image.height} piksel</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {visibleCount < filtered.length && (
                    <div className="flex justify-center pt-5">
                      <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800">
                        Daha fazla göster
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-stone-500">{query ? "Bu aramayla eşleşen görsel bulunamadı." : "Azura’da henüz görsel yok. Yeni bir görsel yükleyebilirsiniz."}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
