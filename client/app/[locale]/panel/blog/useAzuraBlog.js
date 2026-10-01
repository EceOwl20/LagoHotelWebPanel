"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { blogContractHeaders, newAzuraBlogDraft, AZURA_BLOG_ENDPOINT, blogDateInput, blogRequest, saveAzuraBlog } from "@/lib/admin/azura-blog-client.mjs";
import { validAzuraBlogSlug } from "@/lib/admin/azura-blog-model.mjs";

export default function useAzuraBlog({ enabled, version = 2, draft, selectedSlug, setPosts, setSelectedSlug,
  setDraft, setLoading, setSaving, setError, setMessage, setActiveLocale, createEmptyPost }) {
  const [conflict, setConflict] = useState(false);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [mediaOrigin, setMediaOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const baseline = useRef(null);
  const revision = useRef(null);
  const alive = useRef(true);
  const dirty = enabled && baseline.current !== null && JSON.stringify(draft) !== baseline.current;

  const adopt = useCallback((post) => {
    const editable = { ...post, publishedAt: blogDateInput(post.publishedAt) };
    revision.current = post.revision;
    baseline.current = JSON.stringify(editable);
    setSelectedSlug(post.slug); setDraft(editable); setMediaOrigin(post.mediaOrigin);
    setPosts((current) => [post, ...current.filter((p) => p.slug !== post.slug)]);
  }, [setSelectedSlug, setDraft, setPosts]);

  const loadAssets = useCallback(async () => {
    setAssetsLoading(true); setAssetsError("");
    try {
      const payload = await blogRequest("/api/admin/azura/blog/images");
      if (alive.current) setAssets(payload.images);
    } catch (error) { if (alive.current) setAssetsError(error.message); }
    finally { if (alive.current) setAssetsLoading(false); }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    alive.current = true;
    const controller = new AbortController();
    blogRequest(AZURA_BLOG_ENDPOINT, { signal: controller.signal, headers: blogContractHeaders(version) }).then((payload) => {
      if (!alive.current || controller.signal.aborted) return;
      setPosts(payload.posts); setMediaOrigin(payload.mediaOrigin);
      if (payload.posts[0]) adopt(payload.posts[0]);
      else {
        const empty = newAzuraBlogDraft(createEmptyPost, version);
        baseline.current = JSON.stringify(empty); setDraft(empty);
      }
    }).catch((error) => { if (alive.current && !controller.signal.aborted) { setError(error.message); setConflict(true); } })
      .finally(() => { if (alive.current && !controller.signal.aborted) setLoading(false); });
    loadAssets();
    return () => { alive.current = false; controller.abort(); };
  }, [enabled, version, adopt, createEmptyPost, loadAssets, setDraft, setError, setLoading, setPosts]);

  useEffect(() => {
    if (!dirty && !busy) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  const start = () => {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); return true;
  };
  const finish = () => { busyRef.current = false; if (alive.current) { setBusy(false); setSaving(false); } };
  const confirmDiscard = () => !dirty || window.confirm("Kaydedilmemiş blog değişiklikleri bırakılacak. Devam edilsin mi?");
  const fail = (error) => {
    if (!alive.current) return;
    setError(error.message);
    // Network/5xx may follow a successful disk write; require explicit reload.
    if (error.status === 409 || error.status === 404 || error.status >= 500) setConflict(true);
  };

  const save = async ({ publicationStatus } = {}) => {
    if (conflict || !start()) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await saveAzuraBlog({ version, slug: selectedSlug, draft, revision: revision.current, publicationStatus,
        onSaved: (post) => { if (alive.current) adopt(post); } });
      if (alive.current) setMessage(publicationStatus === "published" ? "Blog yazısının güncel taslağı yayınlandı." :
        publicationStatus === "draft" ? "Blog yazısı yayından kaldırıldı; taslak korunuyor." : "Blog taslağı kaydedildi. Canlı içerik değiştirilmedi.");
    } catch (error) { fail(error); }
    finally { finish(); }
  };

  const remove = async () => {
    if (!selectedSlug || conflict || busyRef.current || !window.confirm("Blog yazısı kalıcı olarak silinecek. Fiziksel görseller korunacak. Devam edilsin mi?") || !start()) return;
    setError(""); setMessage("");
    try {
      await blogRequest(`${AZURA_BLOG_ENDPOINT}/${selectedSlug}`, { method: "DELETE", headers: { ...blogContractHeaders(version), "If-Match": `"${revision.current}"` } });
      if (!alive.current) return;
      setPosts((current) => current.filter((p) => p.slug !== selectedSlug));
      reset(); setMessage("Blog yazısı silindi. Fiziksel görseller korundu.");
    } catch (error) { fail(error); }
    finally { finish(); }
  };

  const reset = () => {
    const empty = newAzuraBlogDraft(createEmptyPost, version);
    baseline.current = JSON.stringify(empty); revision.current = null;
    setSelectedSlug(null); setDraft(empty); setActiveLocale("tr"); setConflict(false);
  };
  const createNew = () => {
    if (busyRef.current || !confirmDiscard()) return;
    reset(); setError(""); setMessage("");
  };
  const select = (post) => {
    if (busyRef.current || !confirmDiscard()) return;
    adopt(post); setConflict(false); setError(""); setMessage("");
  };
  const reload = async () => {
    if (busyRef.current || !window.confirm("Sunucudaki güncel içerik forma alınacak. Formdaki yerel değişiklikler bırakılacak. Devam edilsin mi?") || !start()) return;
    try {
      const payload = await blogRequest(AZURA_BLOG_ENDPOINT, { headers: blogContractHeaders(version) });
      if (!alive.current) return;
      setPosts(payload.posts); setMediaOrigin(payload.mediaOrigin);
      const slug = selectedSlug || (validAzuraBlogSlug(draft.slug) ? draft.slug : null);
      const post = payload.posts.find((p) => p.slug === slug);
      if (post) adopt(post); else reset();
      setConflict(false); setError(""); setMessage("Güncel sunucu içeriği yüklendi.");
    } catch (error) { fail(error); }
    finally { finish(); }
  };

  const upload = async (file, onChange) => {
    if (conflict || !start()) return null;
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > 8 * 1024 * 1024) throw new Error("JPEG/PNG/WebP, en fazla 8 MiB yükleyin.");
      const form = new FormData(); form.append("file", file);
      const asset = await blogRequest("/api/admin/azura/blog/images", { method: "POST", body: form });
      if (!alive.current) return null;
      setAssets((current) => [asset, ...current.filter((a) => a.image !== asset.image)]);
      onChange(asset.image); return asset.image;
    } finally { finish(); }
  };

  const imageProps = (value, onChange) => ({
    librarySource: "media", externalAssets: assets, externalLoading: assetsLoading, externalError: assetsError,
    externalUpload: (file) => upload(file, onChange), externalPreviewUrl: value && mediaOrigin ? `${mediaOrigin}${value}` : "",
    disabled: busy || conflict, uploadAccept: "image/jpeg,image/png,image/webp",
    hint: "Azura blog görsellerinden seçin veya yeni görsel yükleyin. Görselin yayını için yazıyı kaydedip yayınlayın.",
  });
  return { save, remove, createNew, select, reload, loadAssets, conflict, busy, dirty, imageProps };
}
