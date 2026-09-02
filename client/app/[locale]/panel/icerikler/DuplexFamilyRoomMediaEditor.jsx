"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Dubleks aile odası hero görseli" },
  {
    path: ["background"],
    label: "Dubleks aile odası tanıtım alanı arka plan görseli",
  },
];

const collections = [
  {
    path: ["gallery"],
    label: "Dubleks aile odası carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function DuplexFamilyRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="duplexfamilyroom"
      pageTitle="Dubleks Aile Odası"
      activeLocale={activeLocale}
      uploadFolder="pages/duplexfamilyroom"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
