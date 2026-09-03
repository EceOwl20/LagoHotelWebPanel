"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";
import { getBarCafeDetailConfigByNamespace } from "@/lib/admin/bar-cafe-detail-config.mjs";

export default function BarCafeDetailMediaEditor({ namespace, activeLocale }) {
  const config = getBarCafeDetailConfigByNamespace(namespace);

  if (!config) {
    return null;
  }

  const singleImages = [
    { path: ["hero"], label: `${config.fieldLabel} hero görseli` },
    { path: ["info", "primary"], label: `${config.fieldLabel} tanıtımı birinci görseli` },
    { path: ["info", "secondary"], label: `${config.fieldLabel} tanıtımı ikinci görseli` },
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
