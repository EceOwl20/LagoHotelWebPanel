"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import RestaurantsPageFields from "./RestaurantsPageFields";
import { LAGO_RESTAURANT_MEDIA_FIELDS, restaurantMediaAtPath } from "@/lib/admin/restaurant-page-fields.mjs";

const BUNDLE_URL = "/api/admin/messages/namespace?namespace=Restaurants";
const MEDIA_URL = "/api/admin/site-pages/restaurants";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const LagoRestaurantsEditor = forwardRef(function LagoRestaurantsEditor({
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
        if (!bundleResponse.ok) throw new Error(bundlePayload.error || "Lago restoran metinleri alınamadı.");
        if (!mediaResponse.ok) throw new Error(mediaPayload.error || "Lago restoran görselleri alınamadı.");
        if (!bundlePayload.bundle || !mediaPayload.content) throw new Error("Lago restoran içeriği eksik.");
        if (LAGO_RESTAURANT_MEDIA_FIELDS.some(({ path }) =>
          !restaurantMediaAtPath(mediaPayload.content, path)?.image)) {
          throw new Error("Lago restoran görsellerinden biri eksik.");
        }
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
      setError("Restoran sayfası için düzenleme kilidi alınamadı veya kayıt sürüyor.");
      return "failed";
    }
    setSaving(true); setError(""); setNotice("");
    let savedBundle = false;
    try {
      if (!same(draft.bundle, original.bundle)) {
        const response = await fetch("/api/admin/messages/namespace", {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Panel-Edit-Lock": lockToken },
          body: JSON.stringify({ namespace: "Restaurants", bundle: draft.bundle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Lago restoran metinleri kaydedilemedi.");
        setOriginal((current) => ({ ...current, bundle: data.bundle }));
        savedBundle = true;
      }
      if (!same(draft.media, original.media)) {
        const response = await fetch(MEDIA_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Panel-Edit-Lock": lockToken,
            "X-Panel-Edit-Namespace": "Restaurants",
          },
          body: JSON.stringify({ content: draft.media }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Lago restoran görselleri kaydedilemedi.");
      }
      const [bundleResponse, mediaResponse] = await Promise.all([
        fetch(BUNDLE_URL, { cache: "no-store" }),
        fetch(MEDIA_URL, { cache: "no-store" }),
      ]);
      const [bundleData, mediaData] = await Promise.all([bundleResponse.json(), mediaResponse.json()]);
      if (!bundleResponse.ok || !mediaResponse.ok || !same(bundleData.bundle, draft.bundle) ||
          LAGO_RESTAURANT_MEDIA_FIELDS.some(({ path }) =>
            !same(restaurantMediaAtPath(mediaData.content, path), restaurantMediaAtPath(draft.media, path)))) {
        throw new Error("Kayıt sonrası tekrar okumada farklı restoran verisi döndü. Sayfayı yenileyip kontrol edin.");
      }
      const page = { bundle: bundleData.bundle, media: mediaData.content };
      setDraft(page); setOriginal(page);
      setNotice("Lago restoran sayfası kaydedildi.");
      return "saved";
    } catch (cause) {
      setError(savedBundle ? `Metinler kaydedildi; ancak medya kaydedilemedi veya doğrulanamadı: ${cause.message}` : cause.message);
      return "failed";
    } finally { setSaving(false); }
  }

  useImperativeHandle(ref, () => ({ save }));
  return <div className="space-y-5">
    {loading ? <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500">Lago restoran içerikleri yükleniyor...</p> : null}
    {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p> : null}
    {draft ? <RestaurantsPageFields bundle={draft.bundle} media={draft.media} activeLocale={activeLocale}
      mediaFields={LAGO_RESTAURANT_MEDIA_FIELDS} disabled={!editable || saving}
      onBundleChange={(updater) => updatePart("bundle", updater)}
      onMediaChange={(updater) => updatePart("media", updater)} /> : null}
  </div>;
});

export default LagoRestaurantsEditor;
