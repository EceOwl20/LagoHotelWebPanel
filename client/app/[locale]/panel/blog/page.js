"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CMS_LOCALES } from "@/lib/admin/constants";

function createEmptyTranslations() {
  return CMS_LOCALES.reduce((accumulator, locale) => {
    accumulator[locale] = {
      title: "",
      excerpt: "",
      content: "",
      seoTitle: "",
      seoDescription: "",
    };
    return accumulator;
  }, {});
}

function createEmptyPost() {
  return {
    slug: "",
    status: "draft",
    coverImage: "",
    publishedAt: new Date().toISOString().slice(0, 16),
    translations: createEmptyTranslations(),
  };
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [draft, setDraft] = useState(createEmptyPost());
  const [activeLocale, setActiveLocale] = useState("tr");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPosts = useCallback(async (preferredSlug = null) => {
    const response = await fetch("/api/admin/blog/posts", { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Blog listesi alinamadi.");
    }

    setPosts(payload.posts);

    if (preferredSlug) {
      const preferredPost = payload.posts.find((post) => post.slug === preferredSlug);
      if (preferredPost) {
        setSelectedSlug(preferredSlug);
        setDraft({
          ...preferredPost,
          publishedAt: preferredPost.publishedAt.slice(0, 16),
        });
        return;
      }
    }

    if (payload.posts.length > 0 && !selectedSlug) {
      setSelectedSlug(payload.posts[0].slug);
      setDraft({
        ...payload.posts[0],
        publishedAt: payload.posts[0].publishedAt.slice(0, 16),
      });
    }
  }, [selectedSlug]);

  useEffect(() => {
    loadPosts()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadPosts]);

  const selectedTranslation = useMemo(
    () => draft.translations?.[activeLocale] || createEmptyTranslations()[activeLocale],
    [activeLocale, draft]
  );

  const selectPost = (post) => {
    setSelectedSlug(post.slug);
    setDraft({ ...post, publishedAt: post.publishedAt.slice(0, 16) });
    setMessage("");
    setError("");
  };

  const updateTranslation = (field, value) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      translations: {
        ...currentDraft.translations,
        [activeLocale]: {
          ...currentDraft.translations[activeLocale],
          [field]: value,
        },
      },
    }));
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog");

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Kapak gorseli yuklenemedi.");
      }

      setDraft((currentDraft) => ({
        ...currentDraft,
        coverImage: payload.url,
      }));
      event.target.value = "";
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const requestInit = {
        method: selectedSlug ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post: {
            ...draft,
            publishedAt: new Date(draft.publishedAt).toISOString(),
          },
        }),
      };

      const url = selectedSlug
        ? `/api/admin/blog/posts/${selectedSlug}`
        : "/api/admin/blog/posts";

      const response = await fetch(url, requestInit);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Blog yazisi kaydedilemedi.");
      }

      const savedPost = payload.post;
      setSelectedSlug(savedPost.slug);
      setDraft({
        ...savedPost,
        publishedAt: savedPost.publishedAt.slice(0, 16),
      });
      await loadPosts(savedPost.slug);
      setMessage("Blog yazisi kaydedildi.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlug) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/blog/posts/${selectedSlug}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Blog yazisi silinemedi.");
      }

      await loadPosts();
      setSelectedSlug(null);
      setDraft(createEmptyPost());
      setMessage("Blog yazisi silindi.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateNew = () => {
    setSelectedSlug(null);
    setDraft(createEmptyPost());
    setActiveLocale("tr");
    setMessage("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">Blog</p>
        <h1 className="text-3xl font-semibold text-stone-900">
          Blog icerik yonetimi
        </h1>
        <p className="max-w-3xl text-sm text-stone-600">
          Blog kartlari ve detay sayfalari bu modulu kullanir. Her yazinin tum
          dillerde baslik, ozet ve govde icerigi ayridir.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-900">Yazilar</div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white"
            >
              Yeni Yazi
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">Yukleniyor...</p>
          ) : posts.length > 0 ? (
            <div className="space-y-2">
              {posts.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  onClick={() => selectPost(post)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    selectedSlug === post.slug
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {post.translations.tr.title ||
                      post.translations.en.title ||
                      post.slug}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] opacity-70">
                    {post.status}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Henuz blog yazisi yok.</p>
          )}
        </aside>

        <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Slug</span>
              <input
                type="text"
                value={draft.slug}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    slug: event.target.value,
                  }))
                }
                className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                placeholder="yeni-blog-yazisi"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Durum</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    status: event.target.value,
                  }))
                }
                className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              >
                <option value="draft">Taslak</option>
                <option value="published">Yayinda</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Yayin tarihi</span>
              <input
                type="datetime-local"
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    publishedAt: event.target.value,
                  }))
                }
                className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Kapak gorseli</span>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white">
                Kapak Yukle
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </label>
            </div>
          </div>

          {draft.coverImage ? (
            <Image
              src={draft.coverImage}
              alt=""
              width={1600}
              height={900}
              unoptimized
              className="h-64 w-full rounded-2xl object-cover"
            />
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-5">
            {CMS_LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={`rounded-xl px-4 py-2 text-sm font-medium uppercase transition ${
                  activeLocale === locale
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {locale}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Baslik</span>
              <input
                type="text"
                value={selectedTranslation.title}
                onChange={(event) => updateTranslation("title", event.target.value)}
                className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Ozet</span>
              <textarea
                rows={3}
                value={selectedTranslation.excerpt}
                onChange={(event) => updateTranslation("excerpt", event.target.value)}
                className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Icerik</span>
              <textarea
                rows={12}
                value={selectedTranslation.content}
                onChange={(event) => updateTranslation("content", event.target.value)}
                className="min-h-[260px] rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">SEO baslik</span>
                <input
                  type="text"
                  value={selectedTranslation.seoTitle}
                  onChange={(event) => updateTranslation("seoTitle", event.target.value)}
                  className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">
                  SEO aciklama
                </span>
                <input
                  type="text"
                  value={selectedTranslation.seoDescription}
                  onChange={(event) =>
                    updateTranslation("seoDescription", event.target.value)
                  }
                  className="rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Kaydediliyor..." : "Blog Yazisini Kaydet"}
            </button>

            {selectedSlug ? (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700"
              >
                Yaziyi Sil
              </button>
            ) : null}

            {message && <span className="text-sm text-emerald-600">{message}</span>}
            {error && <span className="text-sm text-rose-600">{error}</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
