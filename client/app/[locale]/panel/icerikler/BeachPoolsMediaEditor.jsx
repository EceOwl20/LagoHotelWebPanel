"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero", "desktopBackground"], label: "Masaüstü hero arka planı" },
  { path: ["hero", "titleGraphic"], label: "Hero başlık grafiği" },
  { path: ["hero", "wave"], label: "Hero dalga katmanı" },
  { path: ["hero", "mobileBackground"], label: "Mobil hero arka planı" },
  { path: ["info", "primary"], label: "Plaj tanıtımı birinci görseli" },
  { path: ["info", "secondary"], label: "Plaj tanıtımı ikinci görseli" },
  { path: ["cabanaBackground"], label: "Cabana tanıtım arka planı" },
  { path: ["activities", "activity1"], label: "Yüzme ve dinlenme aktivitesi" },
  { path: ["activities", "activity2"], label: "Plaj barı aktivitesi" },
  { path: ["activities", "activity3"], label: "Su sporları aktivitesi" },
  { path: ["activities", "activity4"], label: "Plaj kutlaması aktivitesi" },
  { path: ["pools", "main", "image"], label: "Ana Havuz kart görseli" },
  { path: ["pools", "main", "hover"], label: "Ana Havuz hover görseli" },
  { path: ["pools", "relax", "image"], label: "Rahatlama Havuzu kart görseli" },
  { path: ["pools", "relax", "hover"], label: "Rahatlama Havuzu hover görseli" },
  { path: ["pools", "maldiva", "image"], label: "Maldiva Havuzu kart görseli" },
  { path: ["pools", "maldiva", "hover"], label: "Maldiva Havuzu hover görseli" },
  { path: ["pools", "infinity", "image"], label: "Infinity Havuz kart görseli" },
  { path: ["pools", "infinity", "hover"], label: "Infinity Havuz hover görseli" },
  { path: ["pools", "maldivaKids", "image"], label: "Maldiva Çocuk Havuzu kart görseli" },
  { path: ["pools", "maldivaKids", "hover"], label: "Maldiva Çocuk Havuzu hover görseli" },
  { path: ["pools", "indoor", "image"], label: "Kapalı Havuz kart görseli" },
  { path: ["pools", "indoor", "hover"], label: "Kapalı Havuz hover görseli" },
  { path: ["pools", "aqua", "image"], label: "Aquapark Havuzu kart görseli" },
  { path: ["pools", "aqua", "hover"], label: "Aquapark Havuzu hover görseli" },
  { path: ["pools", "kidsAqua", "image"], label: "Çocuk Aquapark kart görseli" },
  { path: ["pools", "kidsAqua", "hover"], label: "Çocuk Aquapark hover görseli" },
  { path: ["pools", "megaAqua", "image"], label: "Mega Aquapark kart görseli" },
  { path: ["pools", "megaAqua", "hover"], label: "Mega Aquapark hover görseli" },
];

export default function BeachPoolsMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="beachpools"
      pageTitle="Plaj ve Havuzlar"
      activeLocale={activeLocale}
      uploadFolder="pages/beachpools"
      singleImages={singleImages}
      collections={[]}
      localizedAlt
    />
  );
}
