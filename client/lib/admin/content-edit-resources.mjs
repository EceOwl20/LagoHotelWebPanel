import { RESTAURANT_DETAIL_CONFIGS } from "./restaurant-detail-config.mjs";
import { BAR_CAFE_DETAIL_CONFIGS } from "./bar-cafe-detail-config.mjs";

const STATIC_NAMESPACE_PAGE_KEYS = {
  HomePage: "homepage",
  About: "about",
  Contact: "contact",
  ContactSection2: "contactsection2",
  Certificates: "certificates",
  Spa: "spawellness",
  Accommodation: "rooms",
  RoomsParallax: "rooms",
  SuperiorRoom: "superiorroom",
  FamilyRoom: "familyroom",
  SwimupRoom: "swimuproom",
  FamilySwimupRoom: "familyswimup",
  DuplexFamilyRoom: "duplexfamilyroom",
  DisabledRoom: "disableroom",
  TinyVilla: "tinyvilla",
  Restaurants: "restaurants",
  BarAndCafes: "barcafes",
  BeachPools: "beachpools",
  KidsClub: "kidsclub",
  Entertainment: "entertainment",
  Special: "special",
  Fitness: "fitness",
};

const NAMESPACE_PAGE_KEYS = Object.freeze({
  ...STATIC_NAMESPACE_PAGE_KEYS,
  ...Object.fromEntries(
    RESTAURANT_DETAIL_CONFIGS.map((config) => [config.namespace, config.pageKey])
  ),
  ...Object.fromEntries(
    BAR_CAFE_DETAIL_CONFIGS.map((config) => [config.namespace, config.pageKey])
  ),
});

export function getContentEditResourceKey(namespace) {
  const normalizedNamespace = String(namespace || "").trim();
  if (!normalizedNamespace) return "";

  const pageKey = NAMESPACE_PAGE_KEYS[normalizedNamespace];
  return pageKey
    ? `site-page:${pageKey}`
    : `message-namespace:${normalizedNamespace}`;
}

export function namespaceOwnsSitePage(namespace, pageKey) {
  return NAMESPACE_PAGE_KEYS[String(namespace || "").trim()] === pageKey;
}
