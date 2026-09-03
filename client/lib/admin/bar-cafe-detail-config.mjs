export const BAR_CAFE_DETAIL_CONFIGS = Object.freeze([
  {
    namespace: "JoieBar",
    pageKey: "joiebar",
    pageTitle: "Joie Bar",
    fieldLabel: "Joie Bar",
    uploadFolder: "pages/joiebar",
    routeSegment: "joiebar",
    bannerVariant: "main",
    relatedGroup: "bars",
    relatedHeaderKey: "subtitle",
    discoverHeaderKey: "subtitle",
    discoverLink: "/barcafes",
    pageClassName:
      "flex flex-col items-center justify-center gap-[100px] bg-[#fbfbfb] overflow-hidden",
  },
  {
    namespace: "MaldivaBar",
    pageKey: "maldivabar",
    pageTitle: "Maldiva Bar",
    fieldLabel: "Maldiva Bar",
    uploadFolder: "pages/maldivabar",
    routeSegment: "maldivabar",
    bannerVariant: "dark",
    relatedGroup: "bars",
    relatedHeaderKey: "subtitle",
    discoverHeaderKey: "subtitle",
    discoverLink: "/barcafes",
    pageClassName:
      "flex flex-col items-center justify-center gap-[50px] bg-[#fbfbfb] overflow-hidden md:gap-[80px] lg:gap-[100px]",
  },
  {
    namespace: "MignonBar",
    pageKey: "mignonbar",
    pageTitle: "Mignon Bar",
    fieldLabel: "Mignon Bar",
    uploadFolder: "pages/mignonbar",
    routeSegment: "mignonbar",
    bannerVariant: "dark",
    relatedGroup: "bars",
    relatedHeaderKey: "subtitle",
    discoverHeaderKey: "subtitle",
    discoverLink: "/barcafes",
    pageClassName:
      "flex flex-col items-center justify-center gap-[100px] bg-[#fbfbfb] overflow-hidden",
  },
  {
    namespace: "VagoBar",
    pageKey: "vagobar",
    pageTitle: "Vago Bar",
    fieldLabel: "Vago Bar",
    uploadFolder: "pages/vagobar",
    routeSegment: "vagobar",
    bannerVariant: "dark",
    relatedGroup: "bars",
    relatedHeaderKey: "subtitle",
    discoverHeaderKey: "subtitle",
    discoverLink: "/barcafes",
    pageClassName:
      "flex flex-col items-center justify-center gap-[50px] bg-[#fbfbfb] overflow-hidden md:gap-[80px] lg:gap-[100px]",
  },
  {
    namespace: "PianoBar",
    pageKey: "pianobar",
    pageTitle: "Piano Bar",
    fieldLabel: "Piano Bar",
    uploadFolder: "pages/pianobar",
    routeSegment: "pianobar",
    bannerVariant: "dark",
    relatedGroup: "cafes",
    relatedHeaderKey: "title",
    relatedLinks: [
      "/barcafes/mignonbar",
      "/barcafes/joiebar",
      "/barcafes/maldivabar",
      "/barcafes/vagobar",
    ],
    relatedTextKeys: [
      "cuisines1text",
      "cuisines2text",
      "cuisines3text",
      "cuisines3text",
    ],
    discoverHeaderKey: "title",
    discoverLink: "/restaurant",
    pageClassName:
      "flex flex-col items-center justify-center gap-[50px] bg-[#fbfbfb] overflow-hidden md:gap-[80px] lg:gap-[100px]",
  },
]);

export function getBarCafeDetailConfigByNamespace(namespace) {
  return BAR_CAFE_DETAIL_CONFIGS.find((config) => config.namespace === namespace);
}

export function getBarCafeDetailConfigByPageKey(pageKey) {
  return BAR_CAFE_DETAIL_CONFIGS.find((config) => config.pageKey === pageKey);
}
