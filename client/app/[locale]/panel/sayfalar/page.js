"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { PAGE_LOCALES } from "@/lib/pages/schema.mjs";

function getPageStatus(page) {
  if (page.status !== "published") {
    return {
      label: "Taslak",
      className: "bg-amber-100 text-amber-800",
    };
  }

  if (page.hasUnpublishedChanges) {
    return {
      label: "Yayında · Değişiklik var",
      className: "bg-sky-100 text-sky-800",
    };
  }

  return {
    label: "Yayında",
    className: "bg-emerald-100 text-emerald-800",
  };
}

export default function PagesAdminPage() {
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageToDelete, setPageToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadPages = async () => {
      try {
        const response = await fetch("/api/admin/pages", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Sayfa taslakları alınamadı.");
        }

        setPages(payload.pages);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  const handleDelete = async () => {
    if (!pageToDelete) {
      return;
    }

    setDeletingId(pageToDelete.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/pages/${pageToDelete.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Dinamik sayfa silinemedi.");
      }

      setPages((currentPages) =>
        currentPages.filter((page) => page.id !== pageToDelete.id)
      );
      setPageToDelete(null);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Sayfalar</p>
          <h1 className="text-3xl font-semibold text-stone-900">Dinamik sayfa taslakları</h1>
          <p className="max-w-3xl text-sm leading-6 text-stone-600">
            Standart şablonla panelden oluşturulan dinamik sayfalar burada listelenir;
            düzenlenebilir, yayınlanabilir veya onay alınarak silinebilir.
          </p>
        </div>

        <Link
          href="/panel/sayfalar/yeni"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Yeni Sayfa Hazırla
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
          Sayfa taslakları yükleniyor...
        </div>
      ) : pages.length === 0 ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">
            Hazır şablon
          </div>
          <h2 className="mt-2 text-xl font-semibold text-stone-900">
            Henüz kayıtlı sayfa taslağı yok
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Hero, giriş metni, dönüşümlü iki görsel-metin alanı ve iletişim bölümü
            içeren ilk taslağını hazırlayabilirsin.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pages.map((page) => {
            const pageStatus = getPageStatus(page);

            return (
              <article
                key={page.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                    Standart şablon
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">{page.title}</h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${pageStatus.className}`}
                >
                  {pageStatus.label}
                </span>
              </div>

              <div className="mt-5 grid gap-2">
                {PAGE_LOCALES.map((locale) => (
                  <div
                    key={locale}
                    className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2 text-sm"
                  >
                    <span className="w-7 shrink-0 font-semibold uppercase text-stone-500">
                      {locale}
                    </span>
                    {page.publishedSlugs?.[locale] ? (
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/${locale}/${page.publishedSlugs[locale]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-stone-700 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-700"
                        >
                          /{locale}/{page.publishedSlugs[locale]}
                        </a>
                        {page.slugs?.[locale] !== page.publishedSlugs[locale] ? (
                          <span className="mt-1 block truncate text-xs text-sky-700">
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

              <p className="mt-4 text-xs text-stone-500">
                Son güncelleme: {new Date(page.updatedAt).toLocaleString("tr-TR")}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-stone-200 pt-4">
                <Link
                  href={`/panel/sayfalar/${page.id}`}
                  className="inline-flex rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Taslağı Düzenle
                </Link>
                <button
                  type="button"
                  onClick={() => setPageToDelete(page)}
                  className="inline-flex rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Sayfayı Sil
                </button>
              </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        Yayınlanan ve menü görünürlüğü açık olan sayfalar header menüsüne otomatik eklenir.
        Buradaki silme işlemi yalnızca panelden oluşturulan dinamik sayfaları kapsar.
      </div>

      {pageToDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-page-title"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-xs font-medium uppercase tracking-[0.25em] text-rose-600">
              Dinamik sayfayı sil
            </div>
            <h2 id="delete-page-title" className="mt-2 text-2xl font-semibold text-stone-900">
              Emin misiniz?
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              <span className="font-semibold text-stone-900">{pageToDelete.title}</span>{" "}
              sayfasının kaydı kalıcı olarak silinecek. Sayfa yayındaysa public adresleri
              kapanacak ve header bağlantısı otomatik kaldırılacak.
            </p>
            <p className="mt-3 rounded-xl bg-stone-100 p-3 text-xs leading-5 text-stone-600">
              Sayfanın kullandığı yüklenmiş görsel dosyaları silinmeyecektir.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
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
                {deletingId ? "Siliniyor..." : "Evet, Sayfayı Sil"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
