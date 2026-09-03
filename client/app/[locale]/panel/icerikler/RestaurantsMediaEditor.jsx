"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Restoranlar hero görseli" },
  { path: ["culinaryInfo", "primary"], label: "Mutfak tanıtımı birinci görseli" },
  { path: ["culinaryInfo", "secondary"], label: "Mutfak tanıtımı ikinci görseli" },
  { path: ["mainFeature"], label: "Ana restoran tanıtım arka planı" },
  { path: ["cuisines", "anatolia"], label: "Anatolia restoran kartı görseli" },
  { path: ["cuisines", "gusto"], label: "Gusto restoran kartı görseli" },
  { path: ["cuisines", "despina"], label: "Despina restoran kartı görseli" },
  { path: ["reverseInfo", "primary"], label: "Bistro tanıtımı birinci görseli" },
  { path: ["reverseInfo", "secondary"], label: "Bistro tanıtımı ikinci görseli" },
  { path: ["decoration"], label: "Bistro dekoratif görseli" },
  { path: ["cuisinesSecondary", "wasabi"], label: "Wasabi restoran kartı görseli" },
  { path: ["cuisinesSecondary", "fuego"], label: "Fuego restoran kartı görseli" },
  { path: ["cuisinesSecondary", "tapaz"], label: "Tapaz restoran kartı görseli" },
  {
    path: ["detailOptions", "wasabi"],
    label: "Restoran detayları — Wasabi öneri görseli",
  },
  { path: ["discover"], label: "Bar ve kafeleri keşfet arka planı" },
];

export default function RestaurantsMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="restaurants"
      pageTitle="Restoranlar Ana Sayfası"
      activeLocale={activeLocale}
      uploadFolder="pages/restaurants"
      singleImages={singleImages}
      collections={[]}
      localizedAlt
    />
  );
}
