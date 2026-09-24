"use client";
import ObjectEditor from "../components/ObjectEditor";
import KidsClubMediaEditor from "./KidsClubMediaEditor";

export default function KidsClubPageFields({
  bundle, onBundleChange, media, onMediaChange, activeLocale, disabled, hotel = "azura", pageKey: _pageKey, ...mediaProps
}) {
  if (!bundle || !media) return null;
  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
    <ObjectEditor value={bundle[activeLocale] || {}} onChange={(updater) =>
      onBundleChange((current) => ({ ...current, [activeLocale]: updater(current[activeLocale]) }))} />
    <KidsClubMediaEditor activeLocale={activeLocale} hotel={hotel} value={media}
      onChange={onMediaChange} disabled={disabled} {...mediaProps} />
  </fieldset>;
}
