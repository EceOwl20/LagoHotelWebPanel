"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  FiBell,
  FiChevronDown,
  FiFileText,
  FiGrid,
  FiImage,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import PanelSearch from "./PanelSearch";

const pageLabels = [
  { match: "/panel/dashboard", section: "Genel Bakış", title: "Dashboard" },
  { match: "/panel/sayfalar/yeni", section: "Sayfalar", title: "Yeni sayfa" },
  { match: "/panel/sayfalar/", section: "Sayfalar", title: "Taslağı düzenle" },
  { match: "/panel/sayfalar", section: "İçerik", title: "Dinamik sayfalar" },
  { match: "/panel/icerikler", section: "İçerik", title: "Sayfa içerikleri" },
  { match: "/panel/medya", section: "Medya", title: "Medya kütüphanesi" },
  { match: "/panel/galeri", section: "Medya", title: "Galeri" },
  { match: "/panel/blog", section: "İçerik", title: "Blog" },
  { match: "/panel/kullanicilar", section: "Yetkilendirme", title: "Kullanıcılar" },
];

const quickActions = [
  { href: "/panel/sayfalar/yeni", label: "Yeni sayfa", icon: FiFileText },
  { href: "/panel/blog", label: "Blog içeriği", icon: FiPackage },
  { href: "/panel/medya", label: "Medya yükle", icon: FiImage },
];

function getPageLabel(pathname) {
  return (
    pageLabels.find((item) =>
      item.match.endsWith("/") ? pathname.startsWith(item.match) : pathname === item.match
    ) || { section: "Lago Panel", title: "Yönetim Paneli" }
  );
}

function getInitials(user) {
  const source = String(user?.displayName || user?.username || "A").trim();

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export default function TopBar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [draftPages, setDraftPages] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const pageLabel = getPageLabel(pathname);
  const draftCount = draftPages.length;

  const loadDraftPages = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const response = await fetch("/api/admin/pages", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Taslak bildirimleri alınamadı.");
      }

      setDraftPages(
        (Array.isArray(payload.pages) ? payload.pages : []).filter(
          (page) => page.status !== "published"
        )
      );
    } catch (error) {
      setNotificationsError(error.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };
    const openSearchWithShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenMenu("search");
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("keydown", openSearchWithShortcut);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("keydown", openSearchWithShortcut);
    };
  }, []);

  useEffect(() => {
    loadDraftPages();

    const refreshOnFocus = () => loadDraftPages({ silent: true });
    const refreshOnPageChange = () => loadDraftPages({ silent: true });
    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("admin-pages-updated", refreshOnPageChange);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("admin-pages-updated", refreshOnPageChange);
    };
  }, [loadDraftPages, pathname]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Çıkış işlemi tamamlanamadı.");
      }

      router.replace("/panel/login");
      router.refresh();
    } catch (error) {
      setLogoutError(error.message);
      setLoggingOut(false);
    }
  };

  return (
    <header
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 shadow-sm md:left-72 md:px-8"
    >
      <div className="min-w-0">
        <div className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#63978f] sm:flex">
          <span>{pageLabel.section}</span>
          <span className="text-stone-300">/</span>
          <span className="text-stone-400">Panel</span>
        </div>
        <h1 className="truncate text-base font-semibold text-stone-900 sm:mt-0.5 sm:text-lg">
          {pageLabel.title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label="Ara"
          title="Panelde ara (⌘K / Ctrl+K)"
          onClick={() => setOpenMenu("search")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <FiSearch className="h-[18px] w-[18px]" />
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label={draftCount ? `${draftCount} sayfa taslağı yayınlanmayı bekliyor` : "Bildirimler"}
            aria-expanded={openMenu === "notifications"}
            aria-haspopup="menu"
            onClick={() => {
              const willOpen = openMenu !== "notifications";
              setOpenMenu(willOpen ? "notifications" : null);
              if (willOpen) loadDraftPages({ silent: true });
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <FiBell className="h-[18px] w-[18px]" />
            {draftCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm">
                {draftCount > 99 ? "99+" : draftCount}
              </span>
            ) : null}
          </button>

          {openMenu === "notifications" ? (
            <div role="menu" className="absolute right-0 top-11 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
              <div className="flex items-center justify-between px-3 pb-2 pt-1">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Bildirimler</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {draftCount > 0 ? `${draftCount} sayfa yayınlanmayı bekliyor` : "Bekleyen taslak bulunmuyor"}
                  </p>
                </div>
                {draftCount > 0 ? (
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                    {draftCount} TASLAK
                  </span>
                ) : null}
              </div>

              <div className="border-t border-stone-100 pt-2">
                {notificationsLoading ? (
                  <p className="px-3 py-4 text-center text-xs text-stone-500">Taslaklar kontrol ediliyor...</p>
                ) : notificationsError ? (
                  <div className="px-3 py-3">
                    <p className="text-xs leading-5 text-rose-600">{notificationsError}</p>
                    <button type="button" onClick={() => loadDraftPages()} className="mt-2 text-xs font-semibold text-[#507f78] hover:text-[#2f423f]">
                      Tekrar dene
                    </button>
                  </div>
                ) : draftCount > 0 ? (
                  <div className="max-h-72 overflow-y-auto">
                    {draftPages.slice(0, 5).map((page) => (
                      <Link
                        key={page.id}
                        href={`/panel/sayfalar/${page.id}`}
                        role="menuitem"
                        onClick={() => setOpenMenu(null)}
                        className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-[#edf5f3]"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <FiFileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-stone-800">{page.title || "Başlıksız sayfa"}</span>
                          <span className="mt-1 block text-[11px] text-stone-500">Yayınlanmayı bekleyen sayfa taslağı</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-5 text-center">
                    <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FiBell className="h-4 w-4" />
                    </span>
                    <p className="mt-2 text-xs text-stone-500">Tüm sayfalar güncel.</p>
                  </div>
                )}
              </div>

              {draftCount > 0 ? (
                <Link
                  href="/panel/sayfalar"
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="mt-2 flex items-center justify-center rounded-xl border-t border-stone-100 px-3 py-2.5 text-xs font-semibold text-[#507f78] transition hover:bg-stone-50 hover:text-[#2f423f]"
                >
                  Tüm taslakları görüntüle
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button" aria-expanded={openMenu === "quick"} aria-haspopup="menu"
            onClick={() => setOpenMenu(openMenu === "quick" ? null : "quick")}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#2f423f] px-3 text-xs font-semibold text-white transition hover:bg-[#3c5551]"
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden lg:inline">Hızlı Ekle</span>
            <FiChevronDown className="hidden h-3.5 w-3.5 lg:block" />
          </button>
          {openMenu === "quick" ? (
            <div role="menu" className="absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Yeni işlem</p>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} role="menuitem" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-[#edf5f3] hover:text-[#2f423f]">
                    <Icon className="h-4 w-4 text-[#63978f]" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mx-1 hidden h-7 w-px bg-stone-200 sm:block" />

        <div className="relative">
          <button
            type="button" aria-expanded={openMenu === "user"} aria-haspopup="menu"
            onClick={() => setOpenMenu(openMenu === "user" ? null : "user")}
            className="flex h-10 items-center gap-2 rounded-xl px-1.5 transition hover:bg-stone-100 sm:pr-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5f3] text-xs font-semibold text-[#2f423f] ring-1 ring-[#63978f]/20">{getInitials(user)}</span>
            <span className="hidden min-w-0 text-left md:block">
              <span className="block max-w-32 truncate text-xs font-semibold text-stone-700">{user?.displayName || user?.username || "admin"}</span>
              <span className="mt-0.5 block text-[9px] uppercase tracking-[0.14em] text-stone-400">{user?.role === "editor" ? "Editör" : "Yönetici"}</span>
            </span>
            <FiChevronDown className="hidden h-3.5 w-3.5 text-stone-400 md:block" />
          </button>
          {openMenu === "user" ? (
            <div role="menu" className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
              <div className="border-b border-stone-100 px-3 pb-3 pt-1">
                <p className="truncate text-sm font-semibold text-stone-900">{user?.displayName || user?.username || "admin"}</p>
                <p className="mt-1 truncate text-xs text-stone-500">@{user?.username || "admin"}</p>
              </div>
              <div className="py-2">
                <Link href="/panel/dashboard" role="menuitem" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">
                  <FiGrid className="h-4 w-4 text-stone-400" />Dashboard
                </Link>
                {user?.role === "admin" ? (
                  <Link href="/panel/kullanicilar" role="menuitem" onClick={() => setOpenMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100">
                    <FiUsers className="h-4 w-4 text-stone-400" />Kullanıcılar
                  </Link>
                ) : null}
              </div>
              <div className="border-t border-stone-100 pt-2">
                {logoutError ? <p className="px-3 pb-2 text-xs leading-5 text-rose-600">{logoutError}</p> : null}
                <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">
                  <FiLogOut className="h-4 w-4" />{loggingOut ? "Çıkış yapılıyor..." : "Çıkış yap"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {openMenu === "search" ? <PanelSearch onClose={() => setOpenMenu(null)} /> : null}
    </header>
  );
}
