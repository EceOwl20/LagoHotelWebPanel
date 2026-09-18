export const LAGO_RESTAURANT_MEDIA_FIELDS = Object.freeze([
  { path: ["hero"], label: "Restoranlar hero görseli" },
  { path: ["culinaryInfo", "primary"], label: "Mutfak tanıtımı birinci görseli" },
  { path: ["culinaryInfo", "secondary"], label: "Mutfak tanıtımı ikinci görseli" },
  { path: ["mainFeature"], label: "Ana restoran tanıtım arka planı" },
  { path: ["cuisines", "anatolia"], label: "Anatolia restoran kartı" },
  { path: ["cuisines", "gusto"], label: "Gusto restoran kartı" },
  { path: ["cuisines", "despina"], label: "Despina restoran kartı" },
  { path: ["reverseInfo", "primary"], label: "Bistro tanıtımı birinci görseli" },
  { path: ["reverseInfo", "secondary"], label: "Bistro tanıtımı ikinci görseli" },
  { path: ["decoration"], label: "Bistro dekoratif görseli" },
  { path: ["cuisinesSecondary", "wasabi"], label: "Wasabi restoran kartı" },
  { path: ["cuisinesSecondary", "fuego"], label: "Fuego restoran kartı" },
  { path: ["cuisinesSecondary", "tapaz"], label: "Tapaz restoran kartı" },
  { path: ["detailOptions", "wasabi"], label: "Wasabi öneri görseli" },
  { path: ["discover"], label: "Bar ve kafeleri keşfet arka planı" },
]);

export const AZURA_RESTAURANT_MEDIA_FIELDS = Object.freeze([
  { path: ["hero"], label: "Restoranlar hero görseli" },
  { path: ["intro", "primary"], label: "Mutfak tanıtımı birinci görseli" },
  { path: ["intro", "secondary"], label: "Mutfak tanıtımı ikinci görseli" },
  { path: ["mainRestaurant"], label: "Ana restoran arka planı" },
  { path: ["alacarteCarousel", "cards", "orchestra"], label: "Orchestra restoran kartı" },
  { path: ["alacarteCarousel", "cards", "bellaAzura"], label: "Bella Azura restoran kartı" },
  { path: ["alacarteCarousel", "cards", "ottoman"], label: "Ottoman restoran kartı" },
  { path: ["reverse", "primary"], label: "Tatlı tanıtımı birinci görseli" },
  { path: ["reverse", "secondary"], label: "Tatlı tanıtımı ikinci görseli" },
  { path: ["dessertsCarousel", "cards", "patisserie"], label: "Patisserie kartı" },
  { path: ["dessertsCarousel", "cards", "mazurka"], label: "Mazurka kartı" },
  { path: ["dessertsCarousel", "cards", "lyric"], label: "Lyric kartı" },
  { path: ["discover"], label: "Barları keşfet arka planı" },
]);

export function restaurantMediaAtPath(media, path) {
  return path.reduce((value, key) => value?.[key], media);
}
