import assert from "node:assert/strict";
import test from "node:test";
import {
  findMediaReferencesInSources,
  formatMediaReferencePath,
  isSafeUploadUrl,
} from "./media-references.mjs";

test("güvenli upload adresini dizin geçişi denemelerinden ayırır", () => {
  assert.equal(isSafeUploadUrl("/uploads/gallery/general/example-image.webp"), true);
  assert.equal(isSafeUploadUrl("/uploads/pages/example.gif"), true);
  assert.equal(isSafeUploadUrl("/uploads/gallery/flavours/Image min (1).webp"), true);
  assert.equal(isSafeUploadUrl("/uploads/../../content/pages/page.json"), false);
  assert.equal(isSafeUploadUrl("/uploads/gallery\\..\\secret.json"), false);
  assert.equal(isSafeUploadUrl("/images/example.jpg"), false);
});

test("iç içe nesne ve dizilerde aynı medya adresinin bütün kullanımlarını bulur", () => {
  const targetUrl = "/uploads/gallery/general/example.jpg";
  const references = findMediaReferencesInSources(
    [
      {
        id: "page:one",
        type: "dynamicPage",
        label: "Örnek sayfa",
        content: {
          hero: { image: targetUrl },
          sections: [{ image: targetUrl }, { image: "/uploads/pages/other.jpg" }],
        },
      },
    ],
    targetUrl
  );

  assert.deepEqual(references, [
    {
      sourceId: "page:one",
      sourceType: "dynamicPage",
      label: "Örnek sayfa",
      path: "hero.image",
    },
    {
      sourceId: "page:one",
      sourceType: "dynamicPage",
      label: "Örnek sayfa",
      path: "sections[0].image",
    },
  ]);
});

test("silinmekte olan galeri kaynağını taramadan hariç tutar", () => {
  const targetUrl = "/uploads/gallery/general/example.jpg";
  const references = findMediaReferencesInSources(
    [
      {
        id: "gallery:general:image-1",
        type: "gallery",
        label: "Galeri",
        content: { src: targetUrl },
      },
      {
        id: "page:one",
        type: "dynamicPage",
        label: "Örnek sayfa",
        content: { hero: { image: targetUrl } },
      },
    ],
    targetUrl,
    { excludeSourceIds: ["gallery:general:image-1"] }
  );

  assert.equal(references.length, 1);
  assert.equal(references[0].sourceId, "page:one");
});

test("referans yolunu nesne ve dizi alanlarıyla okunabilir biçimde üretir", () => {
  assert.equal(
    formatMediaReferencePath(["sections", 2, "cards", 1, "image"]),
    "sections[2].cards[1].image"
  );
});
