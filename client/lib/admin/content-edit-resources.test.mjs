import assert from "node:assert/strict";
import test from "node:test";
import {
  getContentEditResourceKey,
  namespaceOwnsSitePage,
} from "./content-edit-resources.mjs";

test("medya paylaşan namespace değerleri aynı sayfa kilidini kullanır", () => {
  assert.equal(getContentEditResourceKey("Accommodation"), "site-page:rooms");
  assert.equal(getContentEditResourceKey("RoomsParallax"), "site-page:rooms");
});

test("medya editörü olmayan içerik kendi namespace kilidini kullanır", () => {
  assert.equal(
    getContentEditResourceKey("Header"),
    "message-namespace:Header"
  );
});

test("namespace yalnızca bağlı olduğu mevcut sayfa medyasını düzenleyebilir", () => {
  assert.equal(namespaceOwnsSitePage("HomePage", "homepage"), true);
  assert.equal(namespaceOwnsSitePage("HomePage", "about"), false);
  assert.equal(namespaceOwnsSitePage("Header", "homepage"), false);
});
