"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Odalar hero görseli" },
  { path: ["cards", "superior", "primary"], label: "Superior oda birinci görseli" },
  { path: ["cards", "superior", "secondary"], label: "Superior oda ikinci görseli" },
  { path: ["cards", "family", "primary"], label: "Aile odası birinci görseli" },
  { path: ["cards", "family", "secondary"], label: "Aile odası ikinci görseli" },
  { path: ["cards", "swimup", "primary"], label: "Swim Up oda birinci görseli" },
  { path: ["cards", "swimup", "secondary"], label: "Swim Up oda ikinci görseli" },
  {
    path: ["cards", "familySwimup", "primary"],
    label: "Aile Swim Up oda birinci görseli",
  },
  {
    path: ["cards", "familySwimup", "secondary"],
    label: "Aile Swim Up oda ikinci görseli",
  },
  {
    path: ["cards", "duplexFamily", "primary"],
    label: "Dubleks aile odası birinci görseli",
  },
  {
    path: ["cards", "duplexFamily", "secondary"],
    label: "Dubleks aile odası ikinci görseli",
  },
  {
    path: ["cards", "disabled", "primary"],
    label: "Engelli odası birinci görseli",
  },
  {
    path: ["cards", "disabled", "secondary"],
    label: "Engelli odası ikinci görseli",
  },
];

export default function RoomsMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="rooms"
      pageTitle="Odalar"
      activeLocale={activeLocale}
      uploadFolder="pages/rooms"
      singleImages={singleImages}
      collections={[]}
      localizedAlt
    />
  );
}
