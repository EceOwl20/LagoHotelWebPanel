"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import RoomsPageFields from "./RoomsPageFields";
import { LAGO_ROOM_CARDS } from "@/lib/admin/room-cards-model.mjs";

const BUNDLE_URL = "/api/admin/messages/namespace?namespace=Accommodation";
const MEDIA_URL = "/api/admin/site-pages/rooms";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const LagoRoomsEditor = forwardRef(function LagoRoomsEditor({
  activeLocale, lockToken, editable, onDirtyChange,
}, ref) {
  const [draft, setDraft] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [bundleResponse, mediaResponse] = await Promise.all([
          fetch(BUNDLE_URL, { cache: "no-store" }),
          fetch(MEDIA_URL, { cache: "no-store" }),
        ]);
        const [bundlePayload, mediaPayload] = await Promise.all([
          bundleResponse.json(), mediaResponse.json(),
        ]);
        if (!bundleResponse.ok) throw new Error(bundlePayload.error || "Lago oda metinleri alınamadı.");
        if (!mediaResponse.ok) throw new Error(mediaPayload.error || "Lago oda görselleri alınamadı.");
        if (!bundlePayload.bundle || !mediaPayload.content?.cards) throw new Error("Lago oda içeriği eksik.");
        if (!cancelled) {
          const page = { bundle: bundlePayload.bundle, media: mediaPayload.content };
          setDraft(page); setOriginal(page);
        }
      } catch (cause) { if (!cancelled) setError(cause.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const changed = Boolean(draft && original && !same(draft, original));
  useEffect(() => { onDirtyChange?.(changed); }, [changed, onDirtyChange]);

  function updatePart(part, updater) {
    setDraft((current) => ({ ...current, [part]: updater(current[part]) }));
    setError(""); setNotice("");
  }

  async function save() {
    if (!changed) return "skipped";
    if (!editable || !lockToken || saving) {
      setError("Oda sayfası için düzenleme kilidi alınamadı veya kayıt sürüyor.");
      return "failed";
    }
    setSaving(true); setError(""); setNotice("");
    let savedBundle = false;
    try {
      if (!same(draft.bundle, original.bundle)) {
        const response = await fetch("/api/admin/messages/namespace", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Panel-Edit-Lock": lockToken },
          body: JSON.stringify({ namespace: "Accommodation", bundle: draft.bundle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Lago oda metinleri kaydedilemedi.");
        setOriginal((current) => ({ ...current, bundle: data.bundle }));
        savedBundle = true;
      }
      if (!same(draft.media, original.media)) {
        const response = await fetch(MEDIA_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Panel-Edit-Lock": lockToken,
            "X-Panel-Edit-Namespace": "Accommodation",
          },
          body: JSON.stringify({ content: draft.media }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Lago oda görselleri kaydedilemedi.");
      }
      const [bundleResponse, mediaResponse] = await Promise.all([
        fetch(BUNDLE_URL, { cache: "no-store" }),
        fetch(MEDIA_URL, { cache: "no-store" }),
      ]);
      const [bundleData, mediaData] = await Promise.all([bundleResponse.json(), mediaResponse.json()]);
      if (!bundleResponse.ok || !mediaResponse.ok ||
          !same(bundleData.bundle, draft.bundle) ||
          !same(mediaData.content?.hero, draft.media.hero) ||
          !same(mediaData.content?.cards, draft.media.cards) ||
          !same(mediaData.content?.parallax, draft.media.parallax) ||
          !same(mediaData.content?.otherOptions, draft.media.otherOptions)) {
        throw new Error("Kayıt sonrası tekrar okumada farklı oda verisi döndü. Sayfayı yenileyip kontrol edin.");
      }
      const page = { bundle: bundleData.bundle, media: mediaData.content };
      setDraft(page); setOriginal(page);
      setNotice("Lago oda sayfası kaydedildi.");
      return "saved";
    } catch (cause) {
      setError(savedBundle ? `Metinler kaydedildi; ancak görseller kaydedilemedi veya doğrulanamadı: ${cause.message}` : cause.message);
      return "failed";
    } finally { setSaving(false); }
  }

  useImperativeHandle(ref, () => ({ save }));
  return <div className="space-y-5">
    {loading ? <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500">Lago oda içerikleri yükleniyor...</p> : null}
    {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p> : null}
    {draft ? <RoomsPageFields bundle={draft.bundle} media={draft.media} activeLocale={activeLocale}
      cardConfig={LAGO_ROOM_CARDS} disabled={!editable || saving}
      onBundleChange={(updater) => updatePart("bundle", updater)}
      onMediaChange={(updater) => updatePart("media", updater)} /> : null}
  </div>;
});

export default LagoRoomsEditor;
