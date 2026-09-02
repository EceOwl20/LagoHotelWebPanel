"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Engelli odası hero görseli" },
];

const collections = [
  {
    path: ["gallery"],
    label: "Engelli odası carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function DisabledRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="disableroom"
      pageTitle="Engelli Odası"
      activeLocale={activeLocale}
      uploadFolder="pages/disableroom"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
