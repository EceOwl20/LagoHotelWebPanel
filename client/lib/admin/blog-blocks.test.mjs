import assert from "node:assert/strict";
import test from "node:test";
import {
  getBlogContentBlocksValidationError,
  normalizeBlogContentBlocks,
} from "./blog-blocks.mjs";

test("eski blog kayıtlarında içerik bölümü listesini boş olarak oluşturur", () => {
  assert.deepEqual(normalizeBlogContentBlocks(undefined), []);
});

test("H2 ve H3 bölümlerini dört dil ve isteğe bağlı görselle normalize eder", () => {
  const blocks = normalizeBlogContentBlocks([
    {
      id: "section-1",
      headingLevel: "h3",
      image: "/uploads/blog/section.webp",
      translations: { tr: { heading: "Başlık", content: "Metin" } },
    },
  ]);

  assert.equal(blocks[0].headingLevel, "h3");
  assert.equal(blocks[0].image, "/uploads/blog/section.webp");
  assert.deepEqual(blocks[0].translations.tr, { heading: "Başlık", content: "Metin" });
  assert.deepEqual(blocks[0].translations.en, { heading: "", content: "" });
});

test("tekrarlanan kimlik ve geçersiz başlık seviyesini reddeder", () => {
  const duplicateBlocks = [
    { id: "same", headingLevel: "h2", translations: {} },
    { id: "same", headingLevel: "h3", translations: {} },
  ];

  assert.match(getBlogContentBlocksValidationError(duplicateBlocks), /benzersiz/);
  assert.match(
    getBlogContentBlocksValidationError([
      { id: "section", headingLevel: "h4", translations: {} },
    ]),
    /H2 veya H3/
  );
});
