"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { PAGE_LOCALES } from "@/lib/pages/schema.mjs";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { PERMANENT_DELETE_CONFIRMATION } from "@/lib/admin/trash-policy.mjs";
import { usePanelPermission } from "../PanelSessionContext";
import {
  FiAlertCircle,
  FiArchive,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiTrash2,
  FiUser,
} from "react-icons/fi";

function getPageStatus(page) {
  if (page.status !== "published") {
    return {
      label: "Taslak",
      className: "bg-amber-100 text-amber-800",
      borderClassName: "border-t-amber-400",
    };
  }

  if (page.hasUnpublishedChanges) {
    return {
      label: "Yayında · Değişiklik var",
      className: "bg-sky-100 text-sky-800",
      borderClassName: "border-t-sky-400",
    };
  }

  return {
    label: "Yayında",
    className: "bg-emerald-100 text-emerald-800",
    borderClassName: "border-t-emerald-500",
  };
}

function DeletedPagesView({
  pages,
  loading,
  error,
  onRetry,
  onRestore,
  onPermanentDelete,
}) {
  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-2xl border border-stone-200 bg-white shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 font-medium transition hover:bg-rose-100"
        >
          <FiRefreshCw className="h-4 w-4" />
          Tekrar dene
        </button>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <section className="flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
          <FiArchive className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-stone-900">Çöp kutusu boş</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-stone-500">
          Çöp kutusuna taşıdığınız dinamik sayfalar burada görüntülenecek.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <FiArchive className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Sayfalar ve kullandıkları görseller korunmaktadır. Geri yüklenen içerik
          güvenli biçimde taslak olarak sayfa listesine döner. Kalıcı silme yalnızca
          sayfa kaydını kaldırır; yüklenmiş görsel dosyalarına dokunmaz.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {pages.map((page) => (
          <article
            key={page.id}
            className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  <FiArchive className="h-3.5 w-3.5" />
                  Silinen dinamik sayfa
                </div>
                <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-stone-900">
                  {page.title}
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                {page.status === "published" ? "Yayındaydı" : "Taslak"}
              </span>
            </div>

            <div className="mt-4 grid gap-1.5 rounded-xl border border-stone-100 bg-stone-50/70 p-1.5">
              {PAGE_LOCALES.map((locale) => (
                <div
                  key={locale}
                  className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs shadow-sm ring-1 ring-stone-100"
                >
                  <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded-md bg-stone-100 font-semibold uppercase text-stone-500">
                    {locale}
                  </span>
                  <span className="truncate text-stone-600">
                    {page.slugs?.[locale]
                      ? `/${locale}/${page.slugs[locale]}`
                      : "Slug girilmedi"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-xs text-stone-500">
              <p className="flex items-center gap-2">
                <FiClock className="h-3.5 w-3.5" />
                {page.deletedAt
                  ? new Date(page.deletedAt).toLocaleString("tr-TR")
                  : "Silinme zamanı bulunamadı"}
              </p>
              <p className="flex items-center gap-2">
                <FiUser className="h-3.5 w-3.5" />
                {page.deletedBy?.displayName ||
                  page.deletedBy?.username ||
                  "Kullanıcı bilgisi bulunamadı"}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => onRestore(page)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#63978f]/40 bg-[#edf5f3] px-3 py-2 text-xs font-semibold text-[#2f423f] transition hover:border-[#63978f] hover:bg-[#dfecea]"
              >
                <FiRotateCcw className="h-3.5 w-3.5" />
                Geri Yükle
              </button>
              <button
                type="button"
                onClick={() => onPermanentDelete(page)}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                Kalıcı Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function PagesAdminPage() {
  const router = useRouter();
  const canDelete = usePanelPermission(PANEL_PERMISSIONS.DELETE_CONTENT);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageToDelete, setPageToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [view, setView] = useState("active");
  const [trashedPages, setTrashedPages] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashLoaded, setTrashLoaded] = useState(false);
  const [trashError, setTrashError] = useState("");
  const [pageToRestore, setPageToRestore] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [restoreError, setRestoreError] = useState("");
  const [pageToPermanentlyDelete, setPageToPermanentlyDelete] = useState(null);
  const [permanentlyDeletingId, setPermanentlyDeletingId] = useState(null);
  const [permanentDeleteError, setPermanentDeleteError] = useState("");
  const [permanentDeleteConfirmation, setPermanentDeleteConfirmation] =
    useState("");
  const draftCount = pages.filter((page) => page.status !== "published").length;
  const publishedCount = pages.filter(
    (page) => page.status === "published" && !page.hasUnpublishedChanges
  ).length;
  const changedCount = pages.filter(
    (page) => page.status === "published" && page.hasUnpublishedChanges
  ).length;

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/pages", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Sayfa taslakları alınamadı.");
      }

      setPages(Array.isArray(payload.pages) ? payload.pages : []);
    } catch (loadError) {
      setError(loadError.message || "Sayfa taslakları alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const loadTrashedPages = async () => {
    setTrashLoading(true);
    setTrashError("");

    try {
      const response = await fetch("/api/admin/pages/trash", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Çöp kutusundaki sayfalar alınamadı.");
      }

      setTrashedPages(Array.isArray(payload.pages) ? payload.pages : []);
      setTrashLoaded(true);
    } catch (loadError) {
      setTrashError(loadError.message || "Çöp kutusundaki sayfalar alınamadı.");
    } finally {
      setTrashLoading(false);
    }
  };

  const showTrash = () => {
    setView("trash");

    if (!trashLoaded && !trashLoading) {
      loadTrashedPages();
    }
  };

  const handleDelete = async () => {
    if (!pageToDelete) {
      return;
    }

    setDeletingId(pageToDelete.id);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/pages/${pageToDelete.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Dinamik sayfa çöp kutusuna taşınamadı.");
      }

      setPages((currentPages) =>
        currentPages.filter((page) => page.id !== pageToDelete.id)
      );
      setTrashLoaded(false);
      window.dispatchEvent(new Event("admin-pages-updated"));
      setPageToDelete(null);
      router.refresh();
    } catch (deleteError) {
      setDeleteError(
        deleteError.message || "Dinamik sayfa çöp kutusuna taşınamadı."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async () => {
    if (!pageToRestore) {
      return;
    }

    setRestoringId(pageToRestore.id);
    setRestoreError("");

    try {
      const response = await fetch(
        `/api/admin/pages/trash/${pageToRestore.id}/restore`,
        { method: "POST" }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Dinamik sayfa geri yüklenemedi.");
      }

      setTrashedPages((currentPages) =>
        currentPages.filter((page) => page.id !== pageToRestore.id)
      );
      setPageToRestore(null);
      setView("active");
      window.dispatchEvent(new Event("admin-pages-updated"));
      await loadPages();
      router.refresh();
    } catch (restoreRequestError) {
      setRestoreError(
        restoreRequestError.message || "Dinamik sayfa geri yüklenemedi."
      );
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!pageToPermanentlyDelete) {
      return;
    }

    setPermanentlyDeletingId(pageToPermanentlyDelete.id);
    setPermanentDeleteError("");

    try {
      const response = await fetch(
        `/api/admin/pages/trash/${pageToPermanentlyDelete.id}`,
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirmation: permanentDeleteConfirmation }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Dinamik sayfa kalıcı olarak silinemedi.");
      }

      setTrashedPages((currentPages) =>
        currentPages.filter((page) => page.id !== pageToPermanentlyDelete.id)
      );
      setPermanentDeleteConfirmation("");
      setPageToPermanentlyDelete(null);
    } catch (deleteRequestError) {
      setPermanentDeleteError(
        deleteRequestError.message || "Dinamik sayfa kalıcı olarak silinemedi."
      );
    } finally {
      setPermanentlyDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-lagoBlack px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">
              İçerik yönetimi / Sayfalar
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {view === "trash" ? "Çöp kutusu" : "Dinamik sayfalar"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">
              {view === "trash"
                ? "Çöp kutusuna taşınan dinamik sayfaları ve silinme bilgilerini inceleyin."
                : "Sayfa taslaklarını yönetin, yayın durumlarını takip edin ve içerikleri dört dilde güncelleyin."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {view === "trash" ? (
              <button
                type="button"
                onClick={() => setView("active")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <FiArrowLeft className="h-4 w-4" />
                Sayfalara Dön
              </button>
            ) : (
              <>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={showTrash}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <FiArchive className="h-4 w-4" />
                    Çöp Kutusu
                  </button>
                ) : null}
                <Link
                  href="/panel/sayfalar/yeni"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2f423f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf5f3]"
                >
                  <FiPlus className="h-4 w-4" />
                  Yeni Sayfa Hazırla
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {view === "active" && !loading ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <FiFileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{draftCount}</p>
              <p className="text-xs text-stone-500">Taslak</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FiCheckCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{publishedCount}</p>
              <p className="text-xs text-stone-500">Yayında</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <FiAlertCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold text-stone-900">{changedCount}</p>
              <p className="text-xs text-stone-500">Yayın bekleyen değişiklik</p>
            </div>
          </div>
        </section>
      ) : null}

      {view === "active" && error ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {view === "trash" ? (
        <DeletedPagesView
          pages={trashedPages}
          loading={trashLoading}
          error={trashError}
          onRetry={loadTrashedPages}
          onRestore={(page) => {
            setRestoreError("");
            setPageToRestore(page);
          }}
          onPermanentDelete={(page) => {
            setPermanentDeleteError("");
            setPermanentDeleteConfirmation("");
            setPageToPermanentlyDelete(page);
          }}
        />
      ) : loading ? (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl border border-stone-200 bg-white shadow-sm"
            />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <section className="flex flex-col items-center rounded-3xl border border-dashed border-[#63978f]/50 bg-white px-6 py-14 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5f3] text-[#507f78]">
            <FiFileText className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-stone-900">Henüz sayfa yok</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-stone-500">
            İlk dinamik sayfanızı hazır bir düzenle oluşturup dört dilde yayınlayabilirsiniz.
          </p>
          <Link
            href="/panel/sayfalar/yeni"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3c5551]"
          >
            <FiPlus className="h-4 w-4" />
            İlk sayfayı oluştur
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {pages.map((page) => {
            const pageStatus = getPageStatus(page);

            return (
              <article
                key={page.id}
                className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-x-[#63978f]/40 hover:border-b-[#63978f]/40 hover:shadow-lg `}
              >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#507f78]">
                    <FiFileText className="h-3.5 w-3.5" />
                    Standart şablon
                  </div>
                  <h2 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-6 text-stone-900">
                    {page.title}
                  </h2>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase ${pageStatus.className}`}
                >
                  {pageStatus.label}
                </span>
              </div>

              <div className="mt-4 grid gap-1.5 rounded-xl border border-stone-100 bg-stone-50/70 p-1.5">
                {PAGE_LOCALES.map((locale) => (
                  <div
                    key={locale}
                    className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs shadow-sm ring-1 ring-stone-100"
                  >
                    <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded-md bg-[#edf5f3] font-semibold uppercase text-[#507f78]">
                      {locale}
                    </span>
                    {page.publishedSlugs?.[locale] ? (
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/${locale}/${page.publishedSlugs[locale]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 truncate text-stone-700 transition hover:text-[#507f78]"
                        >
                          <span className="truncate">/{locale}/{page.publishedSlugs[locale]}</span>
                          <FiExternalLink className="h-3 w-3 shrink-0 text-stone-400" />
                        </a>
                        {page.slugs?.[locale] !== page.publishedSlugs[locale] ? (
                          <span className="mt-0.5 block truncate text-[11px] text-sky-700">
                            Taslak adresi: /{locale}/{page.slugs?.[locale] || "slug-girilmedi"}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="truncate text-stone-700">
                        {page.slugs?.[locale]
                          ? `/${locale}/${page.slugs[locale]}`
                          : "Slug girilmedi"}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-3 flex items-center gap-1.5 pb-4 text-[11px] text-stone-500">
                <FiClock className="h-3.5 w-3.5" />
                {new Date(page.updatedAt).toLocaleString("tr-TR")}
              </p>

              <div className="mt-auto flex flex-wrap gap-2.5 border-t border-stone-200 pt-3.5">
                <Link
                  href={`/panel/sayfalar/${page.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-[#63978f] hover:bg-[#edf5f3] hover:text-[#2f423f]"
                >
                  <FiEdit3 className="h-3.5 w-3.5" />
                  Taslağı Düzenle
                </Link>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setPageToDelete(page);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Çöp Kutusuna Taşı
                  </button>
                ) : null}
              </div>
              </article>
            );
          })}
        </div>
      )}

      {view === "active" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#63978f]/30 bg-[#edf5f3] p-4 text-sm leading-6 text-[#2f423f]">
          <FiGlobe className="mt-0.5 h-5 w-5 shrink-0 text-[#507f78]" />
          <p>
            Yayınlanan ve menü görünürlüğü açık sayfalar header menüsüne otomatik
            eklenir. Silme işlemi yalnızca panelden oluşturulan dinamik sayfaları
            kapsar.
          </p>
        </div>
      ) : null}

      {pageToDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-page-title"
          aria-describedby="delete-page-description"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start gap-4 border-b border-stone-200 bg-rose-50 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <FiTrash2 className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.25em] text-rose-600">
                  Çöp kutusuna taşı
                </div>
                <h2 id="delete-page-title" className="mt-1 text-2xl font-semibold text-stone-900">
                  Emin misiniz?
                </h2>
              </div>
            </div>
            <div className="p-6">
            <p id="delete-page-description" className="text-sm leading-6 text-stone-600">
              <span className="font-semibold text-stone-900">{pageToDelete.title}</span>{" "}
              sayfası çöp kutusuna taşınacak. Sayfa yayındaysa public adresleri kapanacak
              ve header bağlantısı otomatik kaldırılacak.
            </p>
            <p className="mt-3 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-600">
              Sayfanın kullandığı yüklenmiş görsel dosyaları silinmeyecektir.
            </p>
            {deleteError ? (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700"
              >
                <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Sayfa çöp kutusuna taşınamadı</p>
                  <p className="mt-0.5 text-xs leading-5">{deleteError}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setPageToDelete(null);
                }}
                disabled={Boolean(deletingId)}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
                className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId
                  ? "Taşınıyor..."
                  : deleteError
                    ? "Tekrar Dene"
                    : "Evet, Çöp Kutusuna Taşı"}
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      {pageToRestore ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-page-title"
          aria-describedby="restore-page-description"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start gap-4 border-b border-[#63978f]/20 bg-[#edf5f3] p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#507f78] shadow-sm">
                <FiRotateCcw className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.25em] text-[#507f78]">
                  Dinamik sayfayı geri yükle
                </div>
                <h2
                  id="restore-page-title"
                  className="mt-1 text-2xl font-semibold text-stone-900"
                >
                  {pageToRestore.status === "published"
                    ? "Yayındaki haliyle geri yüklensin mi?"
                    : "Taslak olarak geri yüklensin mi?"}
                </h2>
              </div>
            </div>
            <div className="p-6">
              <p
                id="restore-page-description"
                className="text-sm leading-6 text-stone-600"
              >
                <span className="font-semibold text-stone-900">
                  {pageToRestore.title}
                </span>{" "}
                {pageToRestore.status === "published"
                  ? "sayfası önceki yayın kopyasıyla birlikte geri dönecek."
                  : "sayfası aktif sayfa listesine taslak olarak geri dönecek."}
              </p>
              <p className="mt-3 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-600">
                {pageToRestore.status === "published"
                  ? "Header bağlantısı yeniden gösterilecek. Silinmeden önce kaydedilmiş yayınlanmamış değişiklikler varsa taslakta korunacaktır."
                  : "Sayfa otomatik yayınlanmayacaktır. Yayınlandığında header bağlantısı görünür."}{" "}
                Aynı ID veya slug kullanımda ise işlem güvenli biçimde engellenecektir.
              </p>

              {restoreError ? (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700"
                >
                  <FiAlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">Sayfa geri yüklenemedi</p>
                    <p className="mt-0.5 text-xs leading-5">{restoreError}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRestoreError("");
                    setPageToRestore(null);
                  }}
                  disabled={Boolean(restoringId)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={Boolean(restoringId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2f423f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRotateCcw className="h-4 w-4" />
                  {restoringId
                    ? "Geri yükleniyor..."
                    : restoreError
                      ? "Tekrar Dene"
                      : pageToRestore.status === "published"
                        ? "Yayında Geri Yükle"
                        : "Taslak Olarak Geri Yükle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pageToPermanentlyDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="permanent-delete-page-title"
          aria-describedby="permanent-delete-page-description"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start gap-4 border-b border-rose-200 bg-rose-50 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <FiTrash2 className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.25em] text-rose-600">
                  Geri alınamaz işlem
                </div>
                <h2
                  id="permanent-delete-page-title"
                  className="mt-1 text-2xl font-semibold text-stone-900"
                >
                  Sayfa kalıcı olarak silinsin mi?
                </h2>
              </div>
            </div>
            <div className="p-6">
              <p
                id="permanent-delete-page-description"
                className="text-sm leading-6 text-stone-600"
              >
                <span className="font-semibold text-stone-900">
                  {pageToPermanentlyDelete.title}
                </span>{" "}
                sayfasının çöp kutusu kaydı geri alınamayacak şekilde silinecek.
              </p>
              <p className="mt-3 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-600">
                Bu işlem yüklenmiş görsel dosyalarını silmez.
              </p>

              <label
                htmlFor="permanent-delete-confirmation"
                className="mt-5 block text-sm font-medium text-stone-800"
              >
                Onaylamak için{" "}
                <span className="font-semibold text-rose-700">
                  {PERMANENT_DELETE_CONFIRMATION}
                </span>{" "}
                yazın.
              </label>
              <input
                id="permanent-delete-confirmation"
                type="text"
                value={permanentDeleteConfirmation}
                onChange={(event) =>
                  setPermanentDeleteConfirmation(event.target.value)
                }
                autoComplete="off"
                disabled={Boolean(permanentlyDeletingId)}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:bg-stone-100"
                placeholder={PERMANENT_DELETE_CONFIRMATION}
              />

              {permanentDeleteError ? (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700"
                >
                  <FiAlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">Sayfa kalıcı olarak silinemedi</p>
                    <p className="mt-0.5 text-xs leading-5">
                      {permanentDeleteError}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPermanentDeleteError("");
                    setPermanentDeleteConfirmation("");
                    setPageToPermanentlyDelete(null);
                  }}
                  disabled={Boolean(permanentlyDeletingId)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handlePermanentDelete}
                  disabled={
                    Boolean(permanentlyDeletingId) ||
                    permanentDeleteConfirmation.trim() !==
                      PERMANENT_DELETE_CONFIRMATION
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                  {permanentlyDeletingId ? "Siliniyor..." : "Kalıcı Olarak Sil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
