import assert from "node:assert/strict";
import test from "node:test";
import { getBlogPostValidationError } from "./blog-policy.mjs";

function createValidPost() {
  return {
    status: "draft",
    publishedAt: "2026-09-09T10:00:00.000Z",
    translations: { tr: { title: "Yeni blog yazısı" } },
  };
}

test("en az bir dilde başlığı bulunan geçerli blog taslağını kabul eder", () => {
  assert.equal(getBlogPostValidationError(createValidPost()), "");
});

test("başlıksız blog kaydını reddeder", () => {
  const post = createValidPost();
  post.translations.tr.title = "   ";

  assert.match(getBlogPostValidationError(post), /başlığı/);
});

test("geçersiz yayın durumunu reddeder", () => {
  assert.match(
    getBlogPostValidationError({ ...createValidPost(), status: "archived" }),
    /yayın durumu/
  );
});

test("geçersiz yayın tarihini reddeder", () => {
  assert.match(
    getBlogPostValidationError({ ...createValidPost(), publishedAt: "geçersiz" }),
    /yayın tarihi/
  );
});

test("geçerli H2 ve H3 içerik bölümlerini kabul eder", () => {
  const post = createValidPost();
  post.contentBlocks = [
    { id: "intro", headingLevel: "h2", image: "", translations: {} },
    { id: "detail", headingLevel: "h3", translations: {} },
  ];

  assert.equal(getBlogPostValidationError(post), "");
});
