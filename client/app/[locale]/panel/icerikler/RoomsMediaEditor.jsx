"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";
import { LAGO_ROOM_CARDS } from "@/lib/admin/room-cards-model.mjs";

const singleImages = [
  { path: ["hero"], label: "Odalar hero görseli" },
  ...LAGO_ROOM_CARDS.flatMap(({ key, label }) => [
    { path: ["cards", key, "primary"], label: `${label} birinci görseli` },
    { path: ["cards", key, "secondary"], label: `${label} ikinci görseli` },
  ]),
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
