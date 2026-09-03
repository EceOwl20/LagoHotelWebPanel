"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Tiny Villa hero görseli" },
  {
    path: ["background"],
    label: "Tiny Villa tanıtım alanı arka plan görseli",
  },
];

const collections = [
  {
    path: ["gallery"],
    label: "Tiny Villa carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function TinyVillaMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="tinyvilla"
      pageTitle="Tiny Villa"
      activeLocale={activeLocale}
      uploadFolder="pages/tinyvilla"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
