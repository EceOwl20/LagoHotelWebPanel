"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";
import { getRestaurantDetailConfigByNamespace } from "@/lib/admin/restaurant-detail-config.mjs";

export default function RestaurantDetailMediaEditor({ namespace, activeLocale }) {
  const config = getRestaurantDetailConfigByNamespace(namespace);

  if (!config) {
    return null;
  }

  const singleImages = [
    { path: ["hero"], label: `${config.fieldLabel} hero görseli` },
    {
      path: ["info", "primary"],
      label: `${config.fieldLabel} tanıtımı birinci görseli`,
    },
    {
      path: ["info", "secondary"],
      label: `${config.fieldLabel} tanıtımı ikinci görseli`,
    },
  ];
  const collections = [
    {
      path: ["gallery"],
      label: `${config.fieldLabel} galeri görselleri`,
      itemLabel: "Galeri görseli",
    },
  ];

  return (
    <SitePageMediaEditor
      pageKey={config.pageKey}
      pageTitle={config.pageTitle}
      activeLocale={activeLocale}
      uploadFolder={config.uploadFolder}
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
