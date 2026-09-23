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

export default function SpaWellnessMediaEditor({ activeLocale, hotel = "lago", pageKey = "spawellness", ...editorProps }) {
  const sport = hotel === "azura" && pageKey === "spor";
  const singles = sport ? [
    { path: ["hero"], label: "Spor kapak görseli" },
    { path: ["info", "wellness"], label: "Spor bilgi alanı büyük görseli" },
    { path: ["info", "sauna"], label: "Spor bilgi alanı ikinci görseli" },
    { path: ["types", "fitness"], label: "Fitness görseli" },
    { path: ["types", "personalTrainer"], label: "Kişisel antrenör görseli" },
  ] : singleImages;
  const groups = sport ? [{ path: ["gallery"], label: "Spor galerisi", itemLabel: "Galeri görseli" }] : collections;
  return (
    <SitePageMediaEditor
      pageKey={sport ? "spor" : "spawellness"}
      pageTitle={sport ? "Spor" : "Spa Wellness"}
      activeLocale={activeLocale}
      uploadFolder={sport ? "pages/spor" : "pages/spawellness"}
      singleImages={singles}
      collections={hotel === "azura" ? groups.map((collection) => ({
        ...collection, imageKey: "image", fixed: true,
      })) : collections}
      localizedAlt
      {...editorProps}
    />
  );
}
