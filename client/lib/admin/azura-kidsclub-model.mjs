export const KIDS_ACTIVITY_IDS = Object.freeze(Array.from({ length: 5 }, (_, i) => `activity${i + 1}`));
export const KIDS_POOL_IDS = Object.freeze(["slide", "children", "indoor"]);
export const KIDS_MOMENT_IDS = Object.freeze(Array.from({ length: 3 }, (_, i) => `kidsclub-moment-${i + 1}`));
export const AZURA_KIDS_IMAGES = [
  { path: ["hero"], label: "Çocuk Kulübü kapak görseli", localizedAlt: false },
  { path: ["info", "primary"], label: "Tanıtım birinci görseli" },
  { path: ["info", "secondary"], label: "Tanıtım ikinci görseli" },
  ...KIDS_ACTIVITY_IDS.map((id, i) => ({ path: ["activities", "items", id], label: `Etkinlik ${i + 1} görseli` })),
  ...KIDS_POOL_IDS.map((id, i) => ({ path: ["pools", id], label: `${["Kaydırak", "Çocuk", "Kapalı Çocuk"][i]} havuzu görseli` })),
];
