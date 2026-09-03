import assert from "node:assert/strict";
import test from "node:test";
import {
  getRestaurantDetailConfigByNamespace,
  getRestaurantDetailConfigByPageKey,
  RESTAURANT_DETAIL_CONFIGS,
} from "./restaurant-detail-config.mjs";

test("restoran detay kayıtları benzersiz namespace ve pageKey değerleri taşır", () => {
  const namespaces = RESTAURANT_DETAIL_CONFIGS.map((config) => config.namespace);
  const pageKeys = RESTAURANT_DETAIL_CONFIGS.map((config) => config.pageKey);
  const routeSegments = RESTAURANT_DETAIL_CONFIGS.map((config) => config.routeSegment);

  assert.equal(new Set(namespaces).size, namespaces.length);
  assert.equal(new Set(pageKeys).size, pageKeys.length);
  assert.equal(new Set(routeSegments).size, routeSegments.length);
});

test("restoran detay kaydı panel ve sunucu anahtarlarından aynı ayarı çözer", () => {
  for (const config of RESTAURANT_DETAIL_CONFIGS) {
    assert.equal(getRestaurantDetailConfigByNamespace(config.namespace), config);
    assert.equal(getRestaurantDetailConfigByPageKey(config.pageKey), config);
    assert.equal(config.uploadFolder, `pages/${config.pageKey}`);
    assert.equal(["dark", "main"].includes(config.bannerVariant), true);
    assert.equal(config.discoverLink.startsWith("/"), true);
    assert.equal(typeof config.overflowHidden, "boolean");
  }
});

test("bilinmeyen restoran anahtarı için ayar döndürmez", () => {
  assert.equal(getRestaurantDetailConfigByNamespace("UnknownRestaurants"), undefined);
  assert.equal(getRestaurantDetailConfigByPageKey("unknownrestaurant"), undefined);
});
