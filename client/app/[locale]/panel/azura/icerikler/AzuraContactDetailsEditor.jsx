"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiSave } from "react-icons/fi";
import ObjectEditor from "../../components/ObjectEditor";
import { usePanelPermission } from "../../PanelSessionContext";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  AZURA_CONTACT_TRANSLATION_FIELDS,
  isValidAzuraSharedContactDetails,
} from "@/lib/admin/azura-shared-contact.mjs";

const API_PATH = "/api/admin/azura/shared/contact/details";
const DETAIL_FIELDS = [
  ["username", "Sosyal medya kullanıcı adı", 100],
  ["phone", "Telefon", 32],
  ["callCenter", "Çağrı merkezi", 32],
  ["email", "E-posta", 254],
  ["instagramUrl", "Instagram adresi", 2048],
  ["facebookUrl", "Facebook adresi", 2048],
  ["youtubeUrl", "YouTube adresi", 2048],
  ["reservationUrl", "Rezervasyon adresi", 2048],
];

export default function AzuraContactDetailsEditor({ activeLocale, onDirtyChange }) {
  const canEdit = usePanelPermission(PANEL_PERMISSIONS.EDIT_CONTENT);
  const [details, setDetails] = useState(null);
  const [original, setOriginal] = useState(null);
  const [revision, setRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(API_PATH, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Azura iletişim bilgileri alınamadı.");
        if (!isValidAzuraSharedContactDetails(data.details)) {
          throw new Error("Azura iletişim bilgileri beklenen biçimde değil.");
        }
        if (!cancelled) {
          setDetails(data.details);
          setOriginal(data.details);
          setRevision(data.revision);
        }
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const changed = Boolean(details && original && JSON.stringify(details) !== JSON.stringify(original));
  useEffect(() => { onDirtyChange?.(changed); }, [changed, onDirtyChange]);

  function changeField(key, value) {
    setError("");
    setSuccess("");
    setDetails((current) => ({ ...current, [key]: value }));
  }

  function changeTranslation(updater) {
    setError("");
    setSuccess("");
    setDetails((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLocale]: updater(current.translations[activeLocale]),
      },
    }));
  }

  async function save(event) {
    event.preventDefault();
    if (!canEdit || !changed || saving) return;
    if (!isValidAzuraSharedContactDetails(details)) {
      setError("Dört dilin metinleri, telefonlar, e-posta ve HTTPS bağlantıları geçerli olmalıdır.");
      setSuccess("");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details, revision }),
      });
      const data = await response.json();
      if (response.status === 409) {
        throw new Error("İletişim bilgileri başka bir sekmede veya kullanıcı tarafından değiştirildi. Değişikliklerinizi kopyalayıp sayfayı yenileyin; eski veriyle kayıt yapılmadı.");
      }
      if (!response.ok) throw new Error(data.error || "Azura iletişim bilgileri kaydedilemedi.");
      const checkResponse = await fetch(API_PATH, { cache: "no-store" });
      const checkData = await checkResponse.json();
      if (!checkResponse.ok || JSON.stringify(checkData.details) !== JSON.stringify(data.details) ||
          checkData.revision !== data.revision) {
        throw new Error("Kaydedilen iletişim bilgileri tekrar okumada farklı döndü. Sayfayı yenileyip kontrol edin.");
      }
      setDetails(checkData.details);
      setOriginal(checkData.details);
      setRevision(checkData.revision);
      setSuccess("Azura iletişim bilgileri kaydedildi. Anasayfada değişikliği kontrol edin.");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Genel alan</p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">İletişim bilgileri</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">Şimdilik yalnızca anasayfadaki iletişim alanını yönetir. Diğer sayfalardaki İletişim Alanı 2 henüz bu veriye bağlı değildir.</p>
        </div>
        {details ? <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${changed ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{changed ? "Kaydedilmedi" : <><FiCheck className="h-3.5 w-3.5" /> Güncel</>}</span> : null}
      </div>
      {!canEdit ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Bu alanı görüntüleyebilirsiniz; düzenleme yetkiniz yok.</p> : null}
      {loading ? <p className="text-sm text-stone-500">Azura iletişim bilgileri yükleniyor...</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p> : null}
      {details ? <>
        <fieldset disabled={!canEdit || saving} className="grid gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 disabled:opacity-70 sm:grid-cols-2 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-stone-900">Otele ait ortak bilgiler</legend>
          {DETAIL_FIELDS.map(([key, label, maxLength]) => <label key={key} className={`flex min-w-0 flex-col gap-2 ${key.endsWith("Url") ? "sm:col-span-2" : ""}`}>
            <span className="text-sm font-semibold text-stone-800">{label}</span>
            <input
              type={key === "email" ? "email" : key.endsWith("Url") ? "url" : "text"}
              value={details[key]}
              maxLength={maxLength}
              onChange={(event) => changeField(key, event.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-[#63978f] focus:ring-4 focus:ring-[#63978f]/10"
            />
          </label>)}
        </fieldset>
        <fieldset disabled={!canEdit || saving} className="disabled:opacity-70">
          <legend className="mb-3 text-sm font-semibold text-stone-900">Seçili dilin metinleri</legend>
          <ObjectEditor
            value={details.translations[activeLocale]}
            onChange={changeTranslation}
            fieldLimits={AZURA_CONTACT_TRANSLATION_FIELDS}
          />
        </fieldset>
        <p className="text-xs leading-5 text-stone-500">Telefonları +90 ile başlayan uluslararası biçimde yazın; bağlantılar otomatik oluşturulur. Sosyal medya ve rezervasyon adresleri HTTPS olmalıdır. Metinlerde Enter ile satır sonu eklemeyin.</p>
        <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
          <button type="submit" disabled={!canEdit || !changed || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2f423f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3c5551] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400">
            <FiSave className="h-4 w-4" />{saving ? "Kaydediliyor..." : "İletişim bilgilerini Azura’ya kaydet"}
          </button>
          {changed ? <p className="text-xs font-medium text-amber-700">Kaydedilmemiş iletişim değişiklikleri var.</p> : null}
        </div>
      </> : null}
    </form>
  );
}
