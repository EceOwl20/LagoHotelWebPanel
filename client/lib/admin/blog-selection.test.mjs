import assert from "node:assert/strict";
import test from "node:test";
import { findBlogPostToSelect } from "./blog-selection.mjs";

const posts = [{ slug: "birinci" }, { slug: "ikinci" }];

test("ilk yüklemede ilk blog yazısını seçer", () => {
  assert.equal(findBlogPostToSelect(posts, { selectFirst: true })?.slug, "birinci");
});

test("yeni yazı modunda mevcut bir yazıyı otomatik seçmez", () => {
  assert.equal(findBlogPostToSelect(posts), null);
});

test("kayıt sonrasında tercih edilen blog yazısını seçer", () => {
  assert.equal(
    findBlogPostToSelect(posts, { preferredSlug: "ikinci" })?.slug,
    "ikinci"
  );
});
