"use client";

import ObjectEditor from "../components/ObjectEditor";
import SpaWellnessMediaEditor from "./SpaWellnessMediaEditor";

export default function SpaPageFields({
  bundle, onBundleChange, media, onMediaChange, activeLocale, disabled, hotel = "lago", ...mediaProps
}) {
  if (!bundle || !media) return null;
  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-70">
    <ObjectEditor value={bundle[activeLocale] || {}} onChange={(updater) =>
      onBundleChange((current) => ({ ...current, [activeLocale]: updater(current[activeLocale]) }))} />
    <SpaWellnessMediaEditor activeLocale={activeLocale} hotel={hotel} value={media}
      onChange={onMediaChange} disabled={disabled} {...mediaProps} />
  </fieldset>;
}
