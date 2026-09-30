"use client";
import ObjectEditor from "../components/ObjectEditor";
import CertificateMediaEditor from "./CertificateMediaEditor";

export default function CertificatePageFields({
  bundle, onBundleChange, media, onMediaChange, activeLocale, disabled, hotel = "azura", pageKey: _pageKey, ...mediaProps
}) {
  if (!bundle || !media) return null;
  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
    <ObjectEditor value={bundle[activeLocale] || {}} onChange={(updater) =>
      onBundleChange((current) => ({ ...current, [activeLocale]: updater(current[activeLocale]) }))} />
    <CertificateMediaEditor activeLocale={activeLocale} hotel={hotel} value={media}
      onChange={onMediaChange} disabled={disabled} {...mediaProps} />
  </fieldset>;
}
