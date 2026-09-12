"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiCalendar,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiImage,
  FiPlus,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { usePanelPermission } from "../PanelSessionContext";
import { findBlogPostToSelect } from "@/lib/admin/blog-selection.mjs";
import PageImagePicker from "../sayfalar/components/PageImagePicker";
import PageEditLockNotice from "../sayfalar/components/PageEditLockNotice";
import useBlogEditLock from "./useBlogEditLock";

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
    contentBlocks: [],
  };
}

function createContentBlock(headingLevel) {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ||
      `blog-block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    headingLevel,
    image: "",
    translations: CMS_LOCALES.reduce((translations, locale) => {
      translations[locale] = { heading: "", content: "" };
      return translations;
    }, {}),
  };
}

const localeLabels = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

function getPostTitle(post) {
  return (
    post?.translations?.tr?.title ||
    post?.translations?.en?.title ||
    post?.translations?.de?.title ||
    post?.translations?.ru?.title ||
    post?.slug ||
    "Başlıksız yazı"
  );
}

export default function BlogAdminPage() {
  const canPublish = usePanelPermission(PANEL_PERMISSIONS.PUBLISH_CONTENT);
  const canDelete = usePanelPermission(PANEL_PERMISSIONS.DELETE_CONTENT);
  const canOverrideEditLock = usePanelPermission(
    PANEL_PERMISSIONS.OVERRIDE_EDIT_LOCK
  );
  const [posts, setPosts] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [draft, setDraft] = useState(createEmptyPost());
  const [activeLocale, setActiveLocale] = useState("tr");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editLock = useBlogEditLock(selectedSlug);
  const isEditBlocked = Boolean(selectedSlug) && !editLock.editable;
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.length - publishedCount;

  const loadPosts = useCallback(async (preferredSlug = null, { selectFirst = false } = {}) => {
    const response = await fetch("/api/admin/blog/posts", { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Blog listesi alinamadi.");
    }

    setPosts(payload.posts);
    const postToSelect = findBlogPostToSelect(payload.posts, {
      preferredSlug,
      selectFirst,
    });

    if (postToSelect) {
      setSelectedSlug(postToSelect.slug);
      setDraft({
        ...postToSelect,
        publishedAt: postToSelect.publishedAt.slice(0, 16),
      });
    }

    return payload.posts;
  }, []);

  useEffect(() => {
    loadPosts(null, { selectFirst: true })
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

  const addContentBlock = (headingLevel) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      contentBlocks: [
        ...(currentDraft.contentBlocks || []),
        createContentBlock(headingLevel),
      ],
    }));
  };

  const updateContentBlock = (blockId, updates) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      contentBlocks: (currentDraft.contentBlocks || []).map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    }));
  };

  const updateContentBlockTranslation = (blockId, field, value) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      contentBlocks: (currentDraft.contentBlocks || []).map((block) =>
        block.id === blockId
          ? {
              ...block,
              translations: {
                ...block.translations,
                [activeLocale]: {
                  ...(block.translations?.[activeLocale] || {}),
                  [field]: value,
                },
              },
            }
          : block
      ),
    }));
  };

  const moveContentBlock = (blockIndex, direction) => {
    setDraft((currentDraft) => {
      const contentBlocks = [...(currentDraft.contentBlocks || [])];
      const targetIndex = blockIndex + direction;

      if (targetIndex < 0 || targetIndex >= contentBlocks.length) return currentDraft;

      [contentBlocks[blockIndex], contentBlocks[targetIndex]] = [
        contentBlocks[targetIndex],
        contentBlocks[blockIndex],
      ];

      return { ...currentDraft, contentBlocks };
    });
  };

  const removeContentBlock = (blockId) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      contentBlocks: (currentDraft.contentBlocks || []).filter(
        (block) => block.id !== blockId
      ),
    }));
  };

  const handleSave = async () => {
    if (isEditBlocked) {
      setError("Bu blog yazısı başka bir kullanıcı tarafından düzenleniyor.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const publishedAt = new Date(draft.publishedAt);

      if (Number.isNaN(publishedAt.getTime())) {
        throw new Error("Geçerli bir yayın tarihi girilmelidir.");
      }

      const requestInit = {
        method: selectedSlug ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(selectedSlug
            ? { "X-Panel-Edit-Lock": editLock.lockToken }
            : {}),
        },
        body: JSON.stringify({
          post: {
            ...draft,
            publishedAt: publishedAt.toISOString(),
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
    if (isEditBlocked) {
      setError("Düzenleme kilidi sizde olmayan bir blog yazısı silinemez.");
      return;
    }

    if (
      !selectedSlug ||
      !window.confirm(
        "Bu blog yazısı kalıcı olarak silinecek. Başka yerde kullanılmayan kapak ve bölüm görselleri de kaldırılacak. Devam etmek istediğinize emin misiniz?"
      )
    ) {
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
      setMessage(
        payload.retainedMedia?.length
          ? `Blog yazısı silindi. ${payload.retainedMedia.length} görsel başka yerlerde kullanıldığı için korundu.`
          : "Blog yazısı ve kullanılmayan görselleri silindi."
      );
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

  const handleLockTakeover = async () => {
    const confirmed = window.confirm(
      "Bu blog yazısının düzenleme kilidini devralmak istediğinize emin misiniz? Diğer kullanıcının henüz kaydetmediği değişiklikler kaybolabilir."
    );

    if (!confirmed) return;

    setError("");
    const acquired = await editLock.takeover();

    if (!acquired) {
      setError("Blog yazısının düzenleme kilidi devralınamadı.");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-lagoBlack px-6 py-7 text-white shadow-lg md:px-9 md:py-9">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#63978f]/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a9c9c4]">
              İçerik yönetimi / Blog
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Blog içerik yönetimi
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-200 md:text-[15px]">
              Blog yazılarını dört dilde hazırlayın, yayın durumlarını yönetin ve
              kapak görsellerini tek bir çalışma alanından düzenleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <FiFileText className="h-4 w-4 text-[#a9c9c4]" />
              {posts.length} yazı
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {publishedCount} yayında
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-stone-100 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              {draftCount} taslak
            </span>
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2f423f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf5f3]"
            >
              <FiPlus className="h-4 w-4" />
              Yeni Yazı
            </button>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/70 p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#63978f]">Yazı arşivi</p>
              <p className="mt-1 text-sm font-semibold text-stone-900">Blog yazıları</p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              title="Yeni yazı oluştur"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f423f] text-white transition hover:bg-[#3c5551]"
            >
              <FiPlus className="h-4 w-4" />
              <span className="sr-only">Yeni Yazı</span>
            </button>
          </div>

          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-2">
              {posts.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  onClick={() => selectPost(post)}
                  className={`group w-full rounded-2xl border px-3 py-3 text-left transition ${
                    selectedSlug === post.slug
                      ? "border-[#2f423f] bg-[#2f423f] text-white shadow-sm"
                      : "border-transparent bg-stone-50 text-stone-700 hover:border-[#63978f]/30 hover:bg-[#edf5f3]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${selectedSlug === post.slug ? "bg-white/10 text-white" : "bg-white text-[#507f78]"}`}>
                      <FiFileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{getPostTitle(post)}</span>
                      <span className={`mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${selectedSlug === post.slug ? "text-stone-300" : post.status === "published" ? "text-emerald-700" : "text-amber-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${post.status === "published" ? "bg-emerald-500" : "bg-amber-400"}`} />
                        {post.status === "published" ? "Yayında" : "Taslak"}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center">
              <FiFileText className="mx-auto h-6 w-6 text-stone-300" />
              <p className="mt-2 text-sm text-stone-500">Henüz blog yazısı yok.</p>
            </div>
          )}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="h-1 bg-gradient-to-r from-[#2f423f] via-[#63978f] to-[#a9c9c4]" />
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf5f3] text-[#507f78]">
                  <FiEdit3 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {selectedSlug ? "Düzenlenen blog yazısı" : "Yeni blog yazısı"}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-semibold text-stone-900 sm:text-2xl">
                    {selectedSlug ? getPostTitle(draft) : "Yeni içerik hazırlayın"}
                  </h2>
                  {selectedSlug ? <p className="mt-0.5 truncate font-mono text-[11px] text-stone-400">/{selectedSlug}</p> : null}
                </div>
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${draft.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                <span className={`h-2 w-2 rounded-full ${draft.status === "published" ? "bg-emerald-500" : "bg-amber-400"}`} />
                {draft.status === "published" ? "Yayında" : "Taslak"}
              </span>
            </div>
          </section>

          {message || error ? (
            <div role={error ? "alert" : "status"} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error ? <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />}
              <span>{error || message}</span>
            </div>
          ) : null}

          <PageEditLockNotice
            status={editLock.status}
            lock={editLock.lock}
            error={editLock.error}
            canOverride={canOverrideEditLock}
            onRetry={editLock.retry}
            onTakeover={handleLockTakeover}
          />

          <fieldset disabled={isEditBlocked} className="min-w-0 disabled:opacity-70">
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50/70 px-5 py-4 sm:px-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5f3] text-[#507f78]">
                <FiCalendar className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold text-stone-900">Yayın ayarları</h3>
                <p className="mt-0.5 text-xs text-stone-500">Adres, durum, tarih ve kapak görselini belirleyin.</p>
              </div>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2 sm:p-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Slug</span>
              <input
                type="text"
                value={draft.slug}
                disabled={Boolean(selectedSlug)}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    slug: event.target.value,
                  }))
                }
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
                placeholder="yeni-blog-yazisi"
              />
              {selectedSlug ? (
                <span className="text-xs text-stone-500">
                  Mevcut yazının adresi değiştirilemez. Farklı bir adres için yeni yazı oluşturun.
                </span>
              ) : null}
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
                className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
              >
                <option value="draft">Taslak</option>
                <option value="published" disabled={!canPublish}>Yayında</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Yayın tarihi</span>
              <input
                type="datetime-local"
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    publishedAt: event.target.value,
                  }))
                }
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
              />
            </label>

            <div className="lg:col-span-2">
              <PageImagePicker
                label="Kapak görseli"
                value={draft.coverImage}
                onChange={(coverImage) =>
                  setDraft((currentDraft) => ({ ...currentDraft, coverImage }))
                }
                hint="Galerideki mevcut bir görseli seçebilir veya bilgisayarınızdan yeni bir görsel yükleyebilirsiniz."
                uploadFolder="blog"
                librarySource="gallery"
              />
            </div>
            </div>
          </section>
          </fieldset>

          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-stone-200 bg-stone-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5f3] text-[#507f78]">
                  <FiGlobe className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-stone-900">İçerik ve SEO</h3>
                  <p className="mt-0.5 text-xs text-stone-500">Düzenleme dili: {localeLabels[activeLocale]}</p>
                </div>
              </div>
              <div className="inline-flex w-fit flex-wrap gap-1 rounded-xl bg-stone-200/70 p-1">
            {CMS_LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                title={localeLabels[locale]}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold uppercase transition ${
                  activeLocale === locale
                    ? "bg-[#2f423f] text-white shadow-sm"
                    : "text-stone-600 hover:bg-white"
                }`}
              >
                {locale}
              </button>
            ))}
              </div>
            </div>

          <fieldset
            disabled={isEditBlocked}
            className="grid min-w-0 gap-5 p-5 disabled:opacity-70 sm:p-6"
          >
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Başlık</span>
              <input
                type="text"
                value={selectedTranslation.title}
                onChange={(event) => updateTranslation("title", event.target.value)}
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Özet</span>
              <textarea
                rows={3}
                value={selectedTranslation.excerpt}
                onChange={(event) => updateTranslation("excerpt", event.target.value)}
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-stone-700">Ana metin</span>
              <textarea
                rows={12}
                value={selectedTranslation.content}
                onChange={(event) => updateTranslation("content", event.target.value)}
                className="min-h-[260px] rounded-xl border border-stone-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
              />
            </label>

            <div className="grid gap-5 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 lg:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">SEO başlık</span>
                <input
                  type="text"
                  value={selectedTranslation.seoTitle}
                  onChange={(event) => updateTranslation("seoTitle", event.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-700">
                  SEO açıklama
                </span>
                <input
                  type="text"
                  value={selectedTranslation.seoDescription}
                  onChange={(event) =>
                    updateTranslation("seoDescription", event.target.value)
                  }
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
                />
              </label>
            </div>
          </fieldset>
          </section>

          <fieldset disabled={isEditBlocked} className="min-w-0 disabled:opacity-70">
          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-stone-200 bg-stone-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5f3] text-[#507f78]">
                  <FiFileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-stone-900">İçerik bölümleri</h3>
                  <p className="mt-0.5 text-xs text-stone-500">
                    İstediğiniz kadar H2 veya H3 bölümü ekleyin. Görsel kullanımı isteğe bağlıdır.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addContentBlock("h2")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2f423f] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3c5551]"
                >
                  <FiPlus className="h-4 w-4" />
                  H2 Bölümü
                </button>
                <button
                  type="button"
                  onClick={() => addContentBlock("h3")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#63978f]/30 bg-[#edf5f3] px-3.5 py-2.5 text-xs font-semibold text-[#365c56] transition hover:bg-[#dfeeea]"
                >
                  <FiPlus className="h-4 w-4" />
                  H3 Bölümü
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {(draft.contentBlocks || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center">
                  <FiFileText className="mx-auto h-7 w-7 text-stone-300" />
                  <p className="mt-3 text-sm font-medium text-stone-600">Henüz içerik bölümü eklenmedi</p>
                  <p className="mt-1 text-xs text-stone-400">
                    Ana metnin altına devam edecek ilk H2 veya H3 bölümünü ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                (draft.contentBlocks || []).map((block, blockIndex) => {
                  const blockTranslation = block.translations?.[activeLocale] || {
                    heading: "",
                    content: "",
                  };

                  return (
                    <article
                      key={block.id}
                      className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-lg bg-[#2f423f] px-2.5 py-1.5 text-xs font-bold uppercase text-white">
                            {block.headingLevel}
                          </span>
                          <span className="text-xs font-medium text-stone-500">
                            Bölüm {blockIndex + 1} · {localeLabels[activeLocale]}
                          </span>
                          {block.image ? (
                            <span className="hidden items-center gap-1 text-xs text-[#507f78] sm:inline-flex">
                              <FiImage className="h-3.5 w-3.5" /> Görselli
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveContentBlock(blockIndex, -1)}
                            disabled={blockIndex === 0}
                            title="Yukarı taşı"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <FiArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveContentBlock(blockIndex, 1)}
                            disabled={blockIndex === draft.contentBlocks.length - 1}
                            title="Aşağı taşı"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <FiArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeContentBlock(block.id)}
                            title="Bölümü kaldır"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="space-y-4">
                          <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-stone-700">
                              {block.headingLevel.toUpperCase()} başlığı
                            </span>
                            <input
                              type="text"
                              value={blockTranslation.heading}
                              onChange={(event) =>
                                updateContentBlockTranslation(
                                  block.id,
                                  "heading",
                                  event.target.value
                                )
                              }
                              className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
                              placeholder={`${localeLabels[activeLocale]} bölüm başlığı`}
                            />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-stone-700">Bölüm metni</span>
                            <textarea
                              rows={6}
                              value={blockTranslation.content}
                              onChange={(event) =>
                                updateContentBlockTranslation(
                                  block.id,
                                  "content",
                                  event.target.value
                                )
                              }
                              className="min-h-36 rounded-xl border border-stone-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
                              placeholder="Paragrafları boş bir satırla ayırabilirsiniz."
                            />
                          </label>
                        </div>

                        <PageImagePicker
                          label="Bölüm görseli (isteğe bağlı)"
                          value={block.image}
                          onChange={(image) => updateContentBlock(block.id, { image })}
                          hint="Galeriden seçebilir veya bilgisayarınızdan yükleyebilirsiniz."
                          uploadFolder="blog"
                          librarySource="gallery"
                          compact
                        />
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
          </fieldset>

          <section className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-800">Değişiklikleri tamamladınız mı?</p>
              <p className="mt-1 text-xs text-stone-500">Kayıt işlemi dört dildeki tüm alanları birlikte günceller.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                isEditBlocked ||
                (!canPublish && draft.status === "published")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <FiSave className="h-4 w-4" />}
              {saving ? "Kaydediliyor..." : "Blog Yazısını Kaydet"}
            </button>

            {selectedSlug && canDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isEditBlocked}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiTrash2 className="h-4 w-4" />
                Yazıyı Sil
              </button>
            ) : null}

            {!canPublish && draft.status === "published" ? (
              <span className="text-sm text-amber-700">
                Yayındaki blog kayıtlarını yalnızca yönetici güncelleyebilir.
              </span>
            ) : null}

            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
