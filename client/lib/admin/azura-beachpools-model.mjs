export const BEACH_ACTIVITY_IDS = Object.freeze(["activity1", "activity2", "activity3", "activity4"]);
export const BEACH_POOL_IDS = Object.freeze(["main", "indoor", "kids", "aqua", "indoorKids"]);
const labels = { main: "Ana Havuz", indoor: "Kapalı Havuz", kids: "Çocuk Havuzu", aqua: "Aquapark", indoorKids: "Kapalı Çocuk Havuzu" };
export const AZURA_BEACH_IMAGES = [
  { path: ["hero", "desktopBackground"], label: "Hero arka planı", localizedAlt: false },
  { path: ["info", "primary"], label: "Plaj tanıtımı birinci görseli" },
  { path: ["info", "secondary"], label: "Plaj tanıtımı ikinci görseli" },
  ...BEACH_ACTIVITY_IDS.map((id, i) => ({ path: ["activities", id], label: `Aktivite ${i + 1} görseli` })),
  ...BEACH_POOL_IDS.flatMap((id) => [
    { path: ["pools", id, "image"], label: `${labels[id]} kart görseli` },
    { path: ["pools", id, "hover"], label: `${labels[id]} hover görseli`, localizedAlt: false },
  ]),
];
