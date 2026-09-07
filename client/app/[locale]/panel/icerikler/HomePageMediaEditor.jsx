"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const imageSections = [
  {
    id: "accommodation-cards",
    title: "Konaklama kartları",
    description: "Yan yana gösterilen Aile Swim Up, Swim Up ve Superior oda görselleri.",
    fields: [
      { path: ["accommodationCards", "familySwimup"], label: "Aile Swim Up oda görseli" },
      { path: ["accommodationCards", "swimup"], label: "Swim Up oda görseli" },
      { path: ["accommodationCards", "superior"], label: "Superior oda görseli" },
    ],
  },
  {
    id: "discovery-carousel",
    title: "Keşif carousel'i",
    description: "Anasayfadaki sayfa kategorilerini tanıtan yedi dikey kart.",
    fields: [
      { path: ["carousel", "accommodation"], label: "Odalar görseli" },
      { path: ["carousel", "beachPools"], label: "Plaj ve Havuzlar görseli" },
      { path: ["carousel", "entertainment"], label: "Eğlence görseli" },
      { path: ["carousel", "restaurants"], label: "Restoranlar görseli" },
      { path: ["carousel", "kidsClub"], label: "Çocuk Kulübü görseli" },
      { path: ["carousel", "spa"], label: "Spa görseli" },
      { path: ["carousel", "bars"], label: "Barlar görseli" },
    ],
  },
  {
    id: "animated-experience",
    title: "Animasyonlu tanıtım alanı",
    description: "Üst üste hareket ederek gösterilen iki tanıtım görseli.",
    fields: [
      { path: ["experience", "background"], label: "Arka görsel" },
      { path: ["experience", "foreground"], label: "Ön görsel" },
    ],
  },
  {
    id: "beach-pools-banner",
    title: "Ortak plaj ve havuzlar banner'ı",
    description: "Anasayfa ve İletişim sayfasında kullanılan ortak banner component'ı.",
    fields: [{ path: ["banner"], label: "Banner arka planı" }],
  },
];

export default function HomePageMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="homepage"
      pageTitle="Ana Sayfa"
      activeLocale={activeLocale}
      uploadFolder="pages/homepage"
      singleImages={[]}
      imageSections={imageSections}
      collections={[]}
      localizedAlt
    />
  );
}
