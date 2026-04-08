"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [namespacesResponse, galleryResponse, postsResponse] = await Promise.all([
          fetch("/api/admin/messages/namespaces", { cache: "no-store" }),
          fetch("/api/admin/gallery", { cache: "no-store" }),
          fetch("/api/admin/blog/posts", { cache: "no-store" }),
        ]);

        const namespacesPayload = await namespacesResponse.json();
        const galleryPayload = await galleryResponse.json();
        const postsPayload = await postsResponse.json();

        if (!namespacesResponse.ok) {
          throw new Error(namespacesPayload.error || "Icerik sayisi alinamadi.");
        }

        if (!galleryResponse.ok) {
          throw new Error(galleryPayload.error || "Galeri bilgisi alinamadi.");
        }

        if (!postsResponse.ok) {
          throw new Error(postsPayload.error || "Blog listesi alinamadi.");
        }

        const imageCount = galleryPayload.gallery.categories.reduce(
          (total, category) => total + category.images.length,
          0
        );

        setSummary({
          namespaceCount: namespacesPayload.namespaces.length,
          categoryCount: galleryPayload.gallery.categories.length,
          imageCount,
          postCount: postsPayload.posts.length,
          latestPostTitle:
            postsPayload.posts[0]?.translations?.tr?.title ||
            postsPayload.posts[0]?.translations?.en?.title ||
            "Henuz blog yazisi yok",
        });
      } catch (err) {
        setError(err.message);
      }
    };

    loadSummary();
  }, []);

  if (error) return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">
          Dosya Tabanli Icerik Merkezi
        </h1>
        <p className="max-w-2xl text-sm text-stone-600">
          Bu panel artik Mongo yerine proje icindeki JSON icerikleri ve
          yuklenen dosyalari yonetiyor. Sayfa metinleri, galeri sekmeleri ve blog
          yazilari ayni yerden kontrol edilebilir.
        </p>
      </div>

      {!summary ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600 shadow-sm">
          Ozet bilgileri yukleniyor...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Mesaj Namespace" value={summary.namespaceCount} />
            <StatCard title="Galeri Kategori" value={summary.categoryCount} />
            <StatCard title="Galeri Gorsel" value={summary.imageCount} />
            <StatCard title="Blog Yazisi" value={summary.postCount} />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">
              Son Durum
            </h2>
            <p className="mt-3 text-sm text-stone-600">
              En guncel blog basligi:{" "}
              <span className="font-medium text-stone-900">
                {summary.latestPostTitle}
              </span>
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Siradaki mantikli adim; once `Sayfa Icerikleri` ekranindan ceviri
              namespace’lerini yonetmek, sonra `Galeri` ve `Blog` modullerini
              aktif kullanmaya baslamak.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-stone-900">{value}</p>
    </div>
  );
}
