"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  FiArrowUp,
  FiCornerDownLeft,
  FiFileText,
  FiGrid,
  FiImage,
  FiPackage,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";

const resultGroups = [
  ["destination", "Panel bölümleri"],
  ["page", "Dinamik sayfalar"],
  ["blog", "Blog"],
  ["media", "Medya"],
  ["user", "Kullanıcılar"],
];

const resultIcons = {
  destination: FiGrid,
  page: FiFileText,
  blog: FiPackage,
  media: FiImage,
  user: FiUsers,
};

const initialDestinations = [
  { id: "recent:pages", type: "destination", title: "Dinamik sayfalar", description: "Taslakları ve yayın durumlarını yönetin", href: "/panel/sayfalar" },
  { id: "recent:contents", type: "destination", title: "Sayfa içerikleri", description: "Sabit sayfa alanlarını düzenleyin", href: "/panel/icerikler" },
  { id: "recent:media", type: "destination", title: "Medya kütüphanesi", description: "Yüklenen görselleri görüntüleyin", href: "/panel/medya" },
];

export default function PanelSearch({ onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const trimmedQuery = query.trim();
  const visibleResults = trimmedQuery.length < 2 ? initialDestinations : results;

  const groupedResults = useMemo(() => {
    const indexedResults = visibleResults.map((result, index) => ({ result, index }));

    return resultGroups
      .map(([type, label]) => ({
        type,
        label: trimmedQuery.length < 2 && type === "destination" ? "Hızlı erişim" : label,
        items: indexedResults.filter((item) => item.result.type === type),
      }))
      .filter((group) => group.items.length > 0);
  }, [trimmedQuery.length, visibleResults]);

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload.error || "Arama tamamlanamadı.");
        setResults(Array.isArray(payload.results) ? payload.results : []);
      } catch (searchError) {
        if (searchError.name !== "AbortError") {
          setResults([]);
          setError(searchError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery]);

  const openResult = (result) => {
    if (!result) return;
    onClose();
    router.push(result.href);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % Math.max(visibleResults.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + Math.max(visibleResults.length, 1)) % Math.max(visibleResults.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      openResult(visibleResults[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-stone-950/35 px-4 pt-[10vh] backdrop-blur-[2px] sm:pt-[14vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Panelde ara"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-stone-200 px-4 sm:px-5">
          <FiSearch className="h-5 w-5 shrink-0 text-[#63978f]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="panel-search-results"
            aria-activedescendant={visibleResults[activeIndex] ? `search-result-${visibleResults[activeIndex].id}` : undefined}
            placeholder="Sayfa, blog, medya veya kullanıcı ara..."
            className="h-16 min-w-0 flex-1 bg-transparent text-[15px] text-stone-900 outline-none placeholder:text-stone-400"
          />
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-[#63978f]" /> : null}
          <button type="button" onClick={onClose} aria-label="Aramayı kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div id="panel-search-results" role="listbox" className="max-h-[min(60vh,32rem)] overflow-y-auto p-2 sm:p-3">
          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">{error}</div>
          ) : trimmedQuery.length >= 2 && !loading && visibleResults.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-400"><FiSearch className="h-5 w-5" /></span>
              <p className="mt-3 text-sm font-semibold text-stone-700">Sonuç bulunamadı</p>
              <p className="mt-1 text-xs text-stone-500">Başka bir başlık, slug veya dosya adı deneyin.</p>
            </div>
          ) : (
            groupedResults.map((group) => (
              <section key={group.type} className="mb-2 last:mb-0">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{group.label}</p>
                {group.items.map(({ result, index }) => {
                  const Icon = resultIcons[result.type] || FiSearch;
                  const active = index === activeIndex;

                  return (
                    <Link
                      id={`search-result-${result.id}`}
                      key={result.id}
                      href={result.href}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition ${active ? "bg-[#edf5f3]" : "hover:bg-stone-50"}`}
                    >
                      {result.thumbnail ? (
                        <span className="h-10 w-10 shrink-0 rounded-xl bg-stone-100 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(result.thumbnail).slice(1, -1)})` }} />
                      ) : (
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white text-[#507f78]" : "bg-stone-100 text-stone-500"}`}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-stone-800">{result.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-stone-500">{result.description}</span>
                      </span>
                      {active ? <FiCornerDownLeft className="h-4 w-4 shrink-0 text-[#63978f]" /> : null}
                    </Link>
                  );
                })}
              </section>
            ))
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-stone-100 bg-stone-50/80 px-5 py-2.5 text-[10px] text-stone-500 sm:flex">
          <span className="flex items-center gap-1.5"><FiArrowUp className="h-3 w-3" /> gezin</span>
          <span className="flex items-center gap-1.5"><FiCornerDownLeft className="h-3 w-3" /> aç</span>
          <span className="ml-auto">En az 2 karakter yazın</span>
        </div>
      </div>
    </div>
  );
}
