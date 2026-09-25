export const AZURA_BAR_IDS = Object.freeze(["lobbyPiano", "chacha", "pier", "lyricSnack"]);
export const AZURA_BAR_IMAGES = [
  { path: ["hero"], label: "Barlar kapak görseli", localizedAlt: false },
  { path: ["culinaryInfo", "primary"], label: "Tanıtım birinci görseli" },
  { path: ["culinaryInfo", "secondary"], label: "Tanıtım ikinci görseli" },
  { path: ["featureBackgrounds", "bars"], label: "Barlar tanıtım arka planı", localizedAlt: false },
  ...AZURA_BAR_IDS.map((id, i) => ({ path: ["bars", id], label: ["Lobby Piano", "Cha Cha", "Pier", "Lyric Snack"][i] + " kart görseli" })),
  { path: ["discover"], label: "Keşfet arka plan görseli", localizedAlt: false },
];
