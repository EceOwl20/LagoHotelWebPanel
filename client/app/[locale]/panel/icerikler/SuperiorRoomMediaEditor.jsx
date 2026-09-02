"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Superior oda hero görseli" },
];

const collections = [
  {
    path: ["gallery"],
    label: "Superior oda carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function SuperiorRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="superiorroom"
      pageTitle="Superior Oda"
      activeLocale={activeLocale}
      uploadFolder="pages/superiorroom"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
