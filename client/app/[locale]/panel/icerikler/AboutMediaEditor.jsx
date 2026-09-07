"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const imageSections = [
  {
    id: "hero",
    title: "Hero alanı",
    description: "Sayfanın en üstünde tam genişlikte gösterilen kapak görseli.",
    fields: [{ path: ["hero"], label: "Hero arka planı" }],
  },
  {
    id: "location",
    title: "Konum tanıtım alanı",
    description: "'Tam olarak olmanız gereken yer' metninin yanında gösterilen görsel.",
    fields: [{ path: ["location"], label: "Konum tanıtımı görseli" }],
  },
  {
    id: "mission-vision",
    title: "Misyon ve vizyon alanı",
    description: "Misyon, vizyon ve bunların altında gösterilen doküman görseli.",
    fields: [
      { path: ["missionVision", "mission"], label: "Misyon görseli" },
      { path: ["missionVision", "vision"], label: "Vizyon görseli" },
      { path: ["missionVision", "document"], label: "Misyon ve vizyon doküman görseli" },
    ],
  },
  {
    id: "discovery-carousel",
    title: "Keşif carousel'i",
    description: "Sayfanın alt bölümündeki yedi yönlendirme kartının görselleri.",
    fields: [
      { path: ["discoveryCarousel", "accommodation"], label: "Odalar görseli" },
      { path: ["discoveryCarousel", "beachPools"], label: "Plaj ve Havuzlar görseli" },
      { path: ["discoveryCarousel", "entertainment"], label: "Eğlence görseli" },
      { path: ["discoveryCarousel", "restaurants"], label: "Restoranlar görseli" },
      { path: ["discoveryCarousel", "kidsClub"], label: "Çocuk Kulübü görseli" },
      { path: ["discoveryCarousel", "spa"], label: "Spa görseli" },
      { path: ["discoveryCarousel", "bars"], label: "Barlar görseli" },
    ],
  },
];

const collections = [
  {
    path: ["moments"],
    label: "LAGO anları carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function AboutMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="about"
      pageTitle="Hakkımızda"
      activeLocale={activeLocale}
      uploadFolder="pages/about"
      singleImages={[]}
      imageSections={imageSections}
      collections={collections}
      localizedAlt
    />
  );
}
