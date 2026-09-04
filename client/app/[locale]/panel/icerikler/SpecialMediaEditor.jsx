"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Özel konsept hero görseli" },
  { path: ["concepts", "honeymoon"], label: "Konsept seçimi · Balayı" },
  { path: ["concepts", "proposal"], label: "Konsept seçimi · Evlilik Teklifi" },
  { path: ["concepts", "birthday"], label: "Konsept seçimi · Doğum Günü" },
  { path: ["concepts", "pavilion"], label: "Konsept seçimi · Pavilyon" },
  { path: ["concepts", "flowers"], label: "Konsept seçimi · Çiçekler" },
  { path: ["cards", "honeymoon"], label: "Konsept kartı · Balayı" },
  { path: ["cards", "pavilion"], label: "Konsept kartı · Pavilyon" },
  { path: ["cards", "proposal"], label: "Konsept kartı · Evlilik Teklifi" },
  { path: ["cards", "birthday"], label: "Konsept kartı · Doğum Günü" },
  { path: ["cards", "flowers"], label: "Konsept kartı · Çiçek Siparişleri" },
  { path: ["info", "primary"], label: "Özel anlar · Birinci görsel" },
  { path: ["info", "secondary"], label: "Özel anlar · İkinci görsel" },
  { path: ["info", "layerOne"], label: "Dekoratif katman · Birinci görsel" },
  { path: ["info", "layerTwo"], label: "Dekoratif katman · İkinci görsel" },
];

const collections = [
  {
    path: ["gallery"],
    label: "Unutulmaz anlar carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function SpecialMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="special"
      pageTitle="Özel Konsept"
      activeLocale={activeLocale}
      uploadFolder="pages/special"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
