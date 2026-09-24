"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";
import { AZURA_KIDS_IMAGES } from "@/lib/admin/azura-kidsclub-model.mjs";

const singleImages = [
  { path: ["hero"], label: "Çocuk Kulübü hero görseli" },
  { path: ["info", "decoration"], label: "Bambu dekor görseli" },
  { path: ["info", "clubs", "mini"], label: "Mini Kulüp kart görseli" },
  { path: ["info", "clubs", "junior"], label: "Junior Kulüp kart görseli" },
  { path: ["info", "clubs", "teenage"], label: "Genç Kulüp kart görseli" },
  { path: ["activities", "items", "activity1"], label: "Lego Odaları görseli" },
  { path: ["activities", "items", "activity2"], label: "Çocuk Aktiviteleri görseli" },
  { path: ["activities", "items", "activity3"], label: "Bebek Odaları görseli" },
  { path: ["activities", "items", "activity4"], label: "Top Havuzu görseli" },
  { path: ["activities", "items", "activity5"], label: "Çocuk Amfisi görseli" },
  { path: ["activities", "items", "activity6"], label: "Trambolin görseli" },
  { path: ["activities", "items", "activity7"], label: "Oyun Alanı görseli" },
  { path: ["activities", "items", "activity8"], label: "Playstation Odaları görseli" },
  { path: ["activities", "items", "activity9"], label: "Oyun Odaları görseli" },
  { path: ["activities", "indicator"], label: "Carousel panda göstergesi" },
  { path: ["pools", "maldiva"], label: "Maldiva Çocuk Havuzu kart görseli" },
  { path: ["pools", "aqua"], label: "Çocuk Aqua Havuzu kart görseli" },
  { path: ["pools", "indoor"], label: "Kapalı Çocuk Havuzu kart görseli" },
];

const collections = [
  {
    path: ["restaurant"],
    label: "Çocuk restoranı carousel görselleri",
    itemLabel: "Restoran görseli",
  },
  {
    path: ["moments"],
    label: "Her An Paylaşmaya Değer galerisi",
    itemLabel: "Galeri görseli",
  },
];

export default function KidsClubMediaEditor({ activeLocale, hotel = "lago", ...editorProps }) {
  return (
    <SitePageMediaEditor
      pageKey="kidsclub"
      pageTitle="Çocuk Kulübü"
      activeLocale={activeLocale}
      uploadFolder="pages/kidsclub"
      singleImages={hotel === "azura" ? AZURA_KIDS_IMAGES : singleImages}
      collections={hotel === "azura" ? [{
        path: ["moments"], label: "Çocuk Kulübü galerisi", itemLabel: "Galeri görseli", imageKey: "image", fixed: true,
      }] : collections}
      localizedAlt
      {...editorProps}
    />
  );
}
