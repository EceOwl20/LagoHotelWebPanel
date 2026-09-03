"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["parallax"], label: "Ortak oda özellik alanı arka plan görseli" },
  {
    path: ["otherOptions", "family"],
    label: "Diğer seçenekler — Aile Odası görseli",
  },
  {
    path: ["otherOptions", "swimup"],
    label: "Diğer seçenekler — Swim Up Odası görseli",
  },
  {
    path: ["otherOptions", "superior"],
    label: "Diğer seçenekler — Superior Oda görseli",
  },
];

export default function SharedRoomMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="rooms"
      pageTitle="Ortak Oda Alanları"
      activeLocale={activeLocale}
      uploadFolder="pages/rooms"
      singleImages={singleImages}
      collections={[]}
      localizedAlt
    />
  );
}
