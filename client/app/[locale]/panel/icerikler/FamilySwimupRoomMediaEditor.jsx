"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Aile Swim Up oda hero görseli" },
  {
    path: ["background"],
    label: "Aile Swim Up oda tanıtım alanı arka plan görseli",
  },
];

const collections = [
  {
    path: ["gallery"],
    label: "Aile Swim Up oda carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function FamilySwimupRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="familyswimup"
      pageTitle="Aile Swim Up Oda"
      activeLocale={activeLocale}
      uploadFolder="pages/familyswimup"
      singleImages={singleImages}
      collections={collections}
      localizedAlt
    />
  );
}
