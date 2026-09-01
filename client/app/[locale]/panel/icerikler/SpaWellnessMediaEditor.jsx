"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Hero görseli" },
  { path: ["info", "wellness"], label: "Spa bilgi alanı büyük görseli" },
  { path: ["info", "sauna"], label: "Sauna ve hamam bilgi görseli" },
  { path: ["types", "indoor"], label: "Kapalı spa alanı görseli" },
  { path: ["types", "turkishBath"], label: "Türk hamamı alanı görseli" },
];

const collections = [
  {
    path: ["gallery"],
    label: "Spa ana carousel görselleri",
    itemLabel: "Carousel görseli",
  },
  {
    path: ["massage"],
    label: "Masaj carousel görselleri",
    itemLabel: "Masaj görseli",
  },
];

export default function SpaWellnessMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="spawellness"
      pageTitle="Spa Wellness"
      activeLocale={activeLocale}
      uploadFolder="pages/spawellness"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
