"use client";

import { useEffect, useMemo, useState } from "react";
import ObjectEditor from "../components/ObjectEditor";
import { CMS_LOCALES } from "@/lib/admin/constants";
import CertificateMediaEditor from "./CertificateMediaEditor";
import RoomsMediaEditor from "./RoomsMediaEditor";
import SpaWellnessMediaEditor from "./SpaWellnessMediaEditor";

export default function PanelContentPage() {
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState("");
  const [bundle, setBundle] = useState(null);
  const [activeLocale, setActiveLocale] = useState("tr");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadNamespaces = async () => {
      try {
        const response = await fetch("/api/admin/messages/namespaces", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Namespace listesi alinamadi.");
        }

        setNamespaces(payload.namespaces);
        setSelectedNamespace(payload.namespaces[0] || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNamespaces();
  }, []);

  useEffect(() => {
    if (!selectedNamespace) {
      return;
    }

    const loadBundle = async () => {
      setError("");
      setMessage("");

      try {
        const response = await fetch(
          `/api/admin/messages/namespace?namespace=${encodeURIComponent(
            selectedNamespace
          )}`,
          { cache: "no-store" }
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Icerik alinamadi.");
        }

        setBundle(payload.bundle);
      } catch (err) {
        setError(err.message);
      }
    };

    loadBundle();
  }, [selectedNamespace]);

  const activeValue = useMemo(() => bundle?.[activeLocale] || {}, [activeLocale, bundle]);

  const updateActiveLocaleValue = (updater) => {
    setBundle((currentBundle) => ({
      ...currentBundle,
      [activeLocale]:
        typeof updater === "function"
          ? updater(currentBundle?.[activeLocale] || {})
          : updater,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/messages/namespace", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namespace: selectedNamespace,
          bundle,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Icerik kaydedilemedi.");
      }

      setBundle(payload.bundle);
      setMessage("Icerik basariyla kaydedildi.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
          Sayfa Icerikleri
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">
          Ceviri namespace editoru
        </h1>
        <p className="max-w-3xl text-sm text-stone-600">
          Bu ekran mevcut `messages/*.json` dosyalarini dogrudan yonetir. Mevcut
          public sayfalar bu verileri kullandigi icin burada yaptigin
          degisiklikler yayin ekranina yansir.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-stone-900">
            Namespace listesi
          </div>
          {loading ? (
            <p className="text-sm text-stone-500">Yukleniyor...</p>
          ) : (
            <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
              {namespaces.map((namespace) => (
                <button
                  key={namespace}
                  type="button"
                  onClick={() => setSelectedNamespace(namespace)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedNamespace === namespace
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {namespace}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-stone-500">
                Aktif namespace
              </div>
              <div className="mt-1 text-2xl font-semibold text-stone-900">
                {selectedNamespace || "Secim yapin"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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
          </div>

          {bundle ? (
            <div className="space-y-5">
              <ObjectEditor value={activeValue} onChange={updateActiveLocaleValue} />

              {selectedNamespace === "Certificates" ? <CertificateMediaEditor /> : null}
              {selectedNamespace === "Spa" ? (
                <SpaWellnessMediaEditor activeLocale={activeLocale} />
              ) : null}
              {selectedNamespace === "Accommodation" ? (
                <RoomsMediaEditor activeLocale={activeLocale} />
              ) : null}

              <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Kaydediliyor..." : "Tum Dilleri Kaydet"}
                </button>

                {message && <span className="text-sm text-emerald-600">{message}</span>}
                {error && <span className="text-sm text-rose-600">{error}</span>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-500">
              Duzenlemek icin soldan bir namespace secin.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
