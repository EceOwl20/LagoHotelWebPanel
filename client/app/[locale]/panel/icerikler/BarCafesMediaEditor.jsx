"use client";

import { AZURA_BAR_IMAGES } from "@/lib/admin/azura-bars-model.mjs";
import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Bar ve kafeler hero görseli" },
  { path: ["culinaryInfo", "primary"], label: "Tanıtım birinci görseli" },
  { path: ["culinaryInfo", "secondary"], label: "Tanıtım ikinci görseli" },
  { path: ["featureBackgrounds", "bars"], label: "Barlar tanıtım arka planı" },
  { path: ["bars", "mignon"], label: "Mignon Bar kart görseli" },
  { path: ["bars", "joie"], label: "Joie Bar kart görseli" },
  { path: ["bars", "maldiva"], label: "Maldiva Bar kart görseli" },
  { path: ["bars", "vago"], label: "Vago Bar kart görseli" },
  { path: ["featureBackgrounds", "cafes"], label: "Kafeler tanıtım arka planı" },
  { path: ["cafes", "piano"], label: "Piano Bar kart görseli" },
  { path: ["cafes", "abella"], label: "Abella Patisserie kart görseli" },
  { path: ["cafes", "lago"], label: "Cafe de Lago kart görseli" },
  { path: ["cafes", "house"], label: "Cafe de House kart görseli" },
  { path: ["discover"], label: "Keşfet arka plan görseli" },
];

const collections = [
  {
    path: ["carousel"],
    label: "Bar ve kafeler carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function BarCafesMediaEditor({ activeLocale, hotel = "lago", ...editorProps }) {
  return (
    <SitePageMediaEditor
      pageKey={hotel === "azura" ? "bars" : "barcafes"}
      pageTitle={hotel === "azura" ? "Barlar" : "Bar ve Kafeler Ana Sayfası"}
      activeLocale={activeLocale}
      uploadFolder={hotel === "azura" ? "pages/bars" : "pages/barcafes"}
      singleImages={hotel === "azura" ? AZURA_BAR_IMAGES : singleImages}
      collections={hotel === "azura" ? [] : collections}
      {...editorProps}
      localizedAlt
    />
  );
}
