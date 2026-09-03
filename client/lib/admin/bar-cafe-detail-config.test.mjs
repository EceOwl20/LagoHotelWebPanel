import assert from "node:assert/strict";
import test from "node:test";
import {
  BAR_CAFE_DETAIL_CONFIGS,
  getBarCafeDetailConfigByNamespace,
  getBarCafeDetailConfigByPageKey,
} from "./bar-cafe-detail-config.mjs";

test("bar ve kafe detay kayıtları benzersiz namespace ve pageKey değerleri taşır", () => {
  const namespaces = BAR_CAFE_DETAIL_CONFIGS.map((config) => config.namespace);
  const pageKeys = BAR_CAFE_DETAIL_CONFIGS.map((config) => config.pageKey);

  assert.equal(new Set(namespaces).size, namespaces.length);
  assert.equal(new Set(pageKeys).size, pageKeys.length);
});

test("bar ve kafe detay kaydı panel ve sunucu anahtarlarından aynı ayarı çözer", () => {
  const config = BAR_CAFE_DETAIL_CONFIGS[0];

  assert.equal(getBarCafeDetailConfigByNamespace(config.namespace), config);
  assert.equal(getBarCafeDetailConfigByPageKey(config.pageKey), config);
});

test("bilinmeyen bar ve kafe anahtarı için ayar döndürmez", () => {
  assert.equal(getBarCafeDetailConfigByNamespace("Unknown"), undefined);
  assert.equal(getBarCafeDetailConfigByPageKey("unknown"), undefined);
});
