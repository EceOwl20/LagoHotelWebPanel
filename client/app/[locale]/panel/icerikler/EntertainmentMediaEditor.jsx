"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Eğlence hero görseli" },
  { path: ["info", "daytime"], label: "Gündüz aktiviteleri görseli" },
  { path: ["info", "nighttime"], label: "Gece aktiviteleri görseli" },
  { path: ["activities", "fitness"], label: "Spor ve Fitness kart görseli" },
  { path: ["activities", "kids"], label: "Çocuk ve Genç Kulübü kart görseli" },
  { path: ["activities", "water"], label: "Su Sporları kart görseli" },
  { path: ["activities", "beachVolley"], label: "Plaj Aktiviteleri kart görseli" },
  { path: ["activities", "sunset"], label: "Gün Batımı Partileri kart görseli" },
  { path: ["activities", "stage"], label: "Sahne Şovları kart görseli" },
  { path: ["activities", "themed"], label: "Tema Partileri kart görseli" },
];

const collections = [
  {
    path: ["gallery"],
    label: "Ritmi Yakala galeri görselleri",
    itemLabel: "Galeri görseli",
  },
];

export default function EntertainmentMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="entertainment"
      pageTitle="Eğlence"
      activeLocale={activeLocale}
      uploadFolder="pages/entertainment"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
