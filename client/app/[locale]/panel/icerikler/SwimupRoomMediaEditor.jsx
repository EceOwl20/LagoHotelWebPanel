"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Swim Up oda hero görseli" },
  {
    path: ["background"],
    label: "Swim Up oda tanıtım alanı arka plan görseli",
  },
];

const collections = [
  {
    path: ["gallery"],
    label: "Swim Up oda carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function SwimupRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="swimuproom"
      pageTitle="Swim Up Oda"
      activeLocale={activeLocale}
      uploadFolder="pages/swimuproom"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
