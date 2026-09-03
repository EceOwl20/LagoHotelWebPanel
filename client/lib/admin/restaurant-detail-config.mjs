export const RESTAURANT_DETAIL_CONFIGS = Object.freeze([
  {
    namespace: "MainRestaurants",
    pageKey: "mainrestaurant",
    pageTitle: "Ana Restoran",
    fieldLabel: "Ana restoran",
    uploadFolder: "pages/mainrestaurant",
    routeSegment: "mainrestaurant",
    bannerVariant: "dark",
    discoverLink: "/restaurant",
    overflowHidden: false,
  },
  {
    namespace: "AnatoliaRestaurants",
    pageKey: "anatoliarestaurant",
    pageTitle: "Anatolia Restoran",
    fieldLabel: "Anatolia restoran",
    uploadFolder: "pages/anatoliarestaurant",
    routeSegment: "anatoliarestaurant",
    bannerVariant: "dark",
    discoverLink: "/barcafes",
    overflowHidden: true,
  },
  {
    namespace: "GustoRestaurants",
    pageKey: "gustorestaurant",
    pageTitle: "Gusto Restoran",
    fieldLabel: "Gusto restoran",
    uploadFolder: "pages/gustorestaurant",
    routeSegment: "gustorestaurant",
    bannerVariant: "main",
    discoverLink: "/barcafes",
    overflowHidden: true,
  },
  {
    namespace: "DespinaRestaurants",
    pageKey: "despinarestaurant",
    pageTitle: "Despina Restoran",
    fieldLabel: "Despina restoran",
    uploadFolder: "pages/despinarestaurant",
    routeSegment: "despinarestaurant",
    bannerVariant: "dark",
    discoverLink: "/barcafes",
    overflowHidden: true,
  },
  {
    namespace: "WasabiRestaurants",
    pageKey: "wasabi",
    pageTitle: "Wasabi Restoran",
    fieldLabel: "Wasabi restoran",
    uploadFolder: "pages/wasabi",
    routeSegment: "wasabi",
    bannerVariant: "dark",
    discoverLink: "/barcafes",
    overflowHidden: true,
  },
  {
    namespace: "FuegoRestaurants",
    pageKey: "fuego",
    pageTitle: "Fuego Restoran",
    fieldLabel: "Fuego restoran",
    uploadFolder: "pages/fuego",
    routeSegment: "fuego",
    bannerVariant: "dark",
    discoverLink: "/barcafes",
    overflowHidden: true,
  },
  {
    namespace: "TapazRestaurants",
    pageKey: "tapazrestaurant",
    pageTitle: "Tapaz Restoran",
    fieldLabel: "Tapaz restoran",
    uploadFolder: "pages/tapazrestaurant",
    routeSegment: "tapazrestaurant",
    bannerVariant: "dark",
    discoverLink: "/barcafes",
    overflowHidden: true,
  },
]);

export function getRestaurantDetailConfigByNamespace(namespace) {
  return RESTAURANT_DETAIL_CONFIGS.find((config) => config.namespace === namespace);
}

export function getRestaurantDetailConfigByPageKey(pageKey) {
  return RESTAURANT_DETAIL_CONFIGS.find((config) => config.pageKey === pageKey);
}
