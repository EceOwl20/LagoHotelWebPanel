"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Fitness hero görseli" },
  { path: ["info", "primary"], label: "Fitness bilgi alanı büyük görseli" },
  { path: ["info", "secondary"], label: "Fitness bilgi alanı yatay görseli" },
  { path: ["features", "beachVolley"], label: "Plaj voleybolu tanıtım görseli" },
  {
    path: ["features", "personalTraining"],
    label: "Kişisel antrenman tanıtım görseli",
  },
];

const collections = [
  {
    path: ["gallery"],
    label: "Fitness ana carousel görselleri",
    itemLabel: "Carousel görseli",
  },
  {
    path: ["activities"],
    label: "Fitness aktiviteleri carousel görselleri",
    itemLabel: "Aktivite görseli",
  },
];

export default function FitnessMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="fitness"
      pageTitle="Fitness"
      activeLocale={activeLocale}
      uploadFolder="pages/fitness"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
