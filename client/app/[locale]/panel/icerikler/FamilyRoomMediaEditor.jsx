"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [{ path: ["hero"], label: "Aile odası hero görseli" }];

const collections = [
  {
    path: ["gallery"],
    label: "Aile odası carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function FamilyRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="familyroom"
      pageTitle="Aile Odası"
      activeLocale={activeLocale}
      uploadFolder="pages/familyroom"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
