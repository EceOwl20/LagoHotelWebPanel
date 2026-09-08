import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchText, rankSearchDocuments } from "./panel-search.mjs";

test("Türkçe karakterleri ve noktalama işaretlerini arama için normalize eder", () => {
  assert.equal(normalizeSearchText("İçerik, Işık & Görsel"), "icerik isik gorsel");
});

test("Kiril karakterli başlıkları arama sırasında korur", () => {
  assert.equal(normalizeSearchText("Детский клуб"), "детскии клуб");
});

test("başlık eşleşmesini düşük ağırlıklı açıklama eşleşmesinden önce sıralar", () => {
  const results = rankSearchDocuments(
    [
      {
        id: "description",
        title: "Başka sayfa",
        searchFields: [{ value: "Havuz açıklaması", weight: 1 }],
      },
      {
        id: "title",
        title: "Havuzlar",
        searchFields: [{ value: "Havuzlar", weight: 3 }],
      },
    ],
    "havuz"
  );

  assert.deepEqual(results.map((result) => result.id), ["title", "description"]);
});

test("çok kelimeli aramada bütün kelimelerin bulunmasını zorunlu tutar", () => {
  const results = rankSearchDocuments(
    [
      {
        id: "complete",
        title: "Spa sayfası",
        searchFields: [
          { value: "Spa", weight: 3 },
          { value: "wellness", weight: 2 },
        ],
      },
      {
        id: "partial",
        title: "Spa",
        searchFields: [{ value: "Spa", weight: 3 }],
      },
    ],
    "spa wellness"
  );

  assert.deepEqual(results.map((result) => result.id), ["complete"]);
});
