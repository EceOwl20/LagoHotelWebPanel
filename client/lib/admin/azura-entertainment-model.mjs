export const ENTERTAINMENT_ACTIVITY_IDS = Object.freeze(["daytime", "nighttime"]);
export const ENTERTAINMENT_GRID_IDS = Object.freeze(["sport-fitness", "kids-teen-club", "water-sports", "beach-activities", "table-tennis", "water-gymnastics", "step-aerobics", "stage-shows", "darts-boccia"]);
export const AZURA_ENTERTAINMENT_IMAGES = [
  { path: ["hero"], label: "Eğlence kapak görseli", localizedAlt: false },
  ...ENTERTAINMENT_ACTIVITY_IDS.map((id, index) => ({ path: ["activities", index], label: index === 0 ? "Gündüz aktiviteleri görseli" : "Gece aktiviteleri görseli" })),
  ...ENTERTAINMENT_GRID_IDS.map((id, index) => ({ path: ["gridSection", index], label: ["Spor ve Fitness", "Çocuk ve Genç Kulübü", "Su Sporları", "Plaj Aktiviteleri", "Masa Tenisi", "Su Jimnastiği", "Step Aerobik", "Sahne Şovları", "Dart ve Boccia"][index] + " kart görseli" })),
];
