"use client";

import ObjectEditor from "../components/ObjectEditor";
import SitePageMediaEditor from "./SitePageMediaEditor";
import { canSelectRoomDetailImage } from "@/lib/admin/room-detail-model.mjs";

const tourLabels = { land: "Kara manzaralı oda", sea: "Deniz manzaralı oda", partialSea: "Yandan deniz manzaralı oda" };

export default function RoomDetailPageFields({
  config, bundle, onBundleChange, media, onMediaChange, activeLocale, disabled, ...mediaProps
}) {
  if (!bundle || !media) return null;
  const azura = config.hotel === "azura";
  const translations = azura ? bundle.translations : bundle;
  const singleImages = [{ path: ["hero"], label: `${config.label} kapak görseli` },
    ...(config.background ? [{ path: ["background"], label: "Tanıtım arka planı" }] : [])];
  const collections = [{ path: ["gallery"], label: `${config.label} galerisi`, itemLabel: "Galeri görseli",
    ...(azura ? { imageKey: "image", fixed: true } : {}) },
    ...(azura ? [{ path: ["otherOptions"], label: `Diğer oda seçenekleri — ${config.optionIds.map((id) => id[0].toUpperCase() + id.slice(1)).join(" / ")}`,
      itemLabel: "Öneri görseli", imageKey: "image", fixed: true }] : [])];
  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
    <ObjectEditor value={translations[activeLocale] || {}} onChange={(updater) => onBundleChange((current) =>
      azura ? { ...current, translations: { ...current.translations, [activeLocale]: updater(current.translations[activeLocale]) } }
        : { ...current, [activeLocale]: updater(current[activeLocale]) })} />
    {azura ? <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-stone-900">Sanal turlar</h2>
      <p className="text-sm text-stone-500">Tur bağlantıları tüm dillerde ortaktır. Kuula koleksiyon bağlantısını girin.</p>
      {bundle.tours.map((tour) => <label key={tour.id} className="flex flex-col gap-2 text-sm font-medium text-stone-700">
        {tourLabels[tour.id] || tour.id}
        <input type="url" maxLength={1500} value={tour.url} disabled={disabled}
          onChange={(event) => onBundleChange((current) => ({ ...current,
            tours: current.tours.map((item) => item.id === tour.id ? { ...item, url: event.target.value } : item) }))}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900" />
      </label>)}
    </section> : null}
    <SitePageMediaEditor pageKey={config.pageKey} pageTitle={config.label} activeLocale={activeLocale}
      uploadFolder={`pages/${config.pageKey}`} singleImages={singleImages} collections={collections}
      value={media} onChange={onMediaChange} disabled={disabled} localizedAlt {...mediaProps}
      externalAssetFilter={azura ? (field, asset) => canSelectRoomDetailImage(config, field, asset) : undefined} />
  </fieldset>;
}
