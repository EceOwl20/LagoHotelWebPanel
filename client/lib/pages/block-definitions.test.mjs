import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  getBlockDefinition,
  getBlockDefinitionsForTemplate,
  getBlockVariant,
  validateBlock,
  validateDefinitionRegistry,
} from "./block-definitions.mjs";

test("block kayıt sistemi benzersiz ve eksiksiz tanımlardan oluşur", () => {
  assert.deepEqual(validateDefinitionRegistry(Object.values(BLOCK_DEFINITIONS)), []);
  assert.deepEqual(Object.keys(BLOCK_DEFINITIONS), BLOCK_TYPES);
});

test("standard şablonu yalnızca izin verilen block tanımlarını listeler", () => {
  const definitions = getBlockDefinitionsForTemplate("standard");

  assert.deepEqual(
    definitions.map((definition) => definition.type),
    ["intro", "imageText", "gallery", "carousel", "callToAction", "cardCollection"]
  );
  assert.equal(definitions.every((definition) => definition.fields.length > 0), true);
});

test("eski imageText verisinden geriye uyumlu varyant çözer", () => {
  assert.equal(getBlockVariant({ type: "imageText", imagePosition: "left" }), "imageLeft");
  assert.equal(getBlockVariant({ type: "imageText", imagePosition: "right" }), "imageRight");
});

test("bilinmeyen varyantı kayıt sırasında reddeder", () => {
  const errors = validateBlock({
    type: "intro",
    variant: "unknown",
  });

  assert.equal(errors.some((error) => error.includes("desteklenmeyen varyant")), true);
});

test("block tanımındaki tekrarlanan type değerini yakalar", () => {
  const definition = getBlockDefinition("intro");
  const errors = validateDefinitionRegistry([definition, definition]);

  assert.equal(errors.some((error) => error.includes("tekrarlanan type")), true);
});

test("intro form alanlarının panel metadatasını taşır", () => {
  assert.deepEqual(getBlockDefinition("intro").fields, [
    { name: "eyebrow", label: "Üst başlık", type: "text", localized: true },
    { name: "title", label: "Başlık", type: "text", localized: true },
    { name: "text", label: "Metin", type: "textarea", localized: true },
  ]);
});

test("block tanımındaki eksik etiket ve tekrarlanan alan adını yakalar", () => {
  const definition = getBlockDefinition("intro");
  const errors = validateDefinitionRegistry([
    {
      ...definition,
      fields: [
        definition.fields[0],
        { name: "eyebrow", type: "text", localized: true },
      ],
    },
  ]);

  assert.equal(errors.some((error) => error.includes("tekrarlanan alan adı")), true);
  assert.equal(errors.some((error) => error.includes("label zorunludur")), true);
});

test("imageText görsel ve konum alanlarını şema üzerinden tanımlar", () => {
  const fields = getBlockDefinition("imageText").fields;
  const imageField = fields.find((field) => field.name === "image");
  const positionField = fields.find((field) => field.name === "imagePosition");

  assert.equal(imageField.type, "image");
  assert.equal(imageField.localized, false);
  assert.deepEqual(positionField.options, [
    { label: "Solda", value: "left" },
    { label: "Sağda", value: "right" },
  ]);
});

test("select alanında eksik ve tekrarlanan seçenekleri reddeder", () => {
  const definition = getBlockDefinition("imageText");
  const selectField = definition.fields.find((field) => field.type === "select");
  const errors = validateDefinitionRegistry([
    {
      ...definition,
      fields: [
        ...definition.fields.filter((field) => field.type !== "select"),
        {
          ...selectField,
          options: [
            { label: "Solda", value: "left" },
            { label: "Yine solda", value: "left" },
            { label: "Eksik değer" },
          ],
        },
      ],
    },
  ]);

  assert.equal(errors.some((error) => error.includes("tekrarlanan select değeri")), true);
  assert.equal(errors.some((error) => error.includes("label ve value zorunludur")), true);
});

test("gallery ve carousel sıralanabilir görsel dizisi metadatasını taşır", () => {
  const galleryField = getBlockDefinition("gallery").fields.find(
    (field) => field.type === "imageArray"
  );
  const carouselField = getBlockDefinition("carousel").fields.find(
    (field) => field.type === "imageArray"
  );

  assert.deepEqual(galleryField.labels, {
    singular: "Galeri görseli",
    plural: "Galeri görselleri",
  });
  assert.equal(galleryField.addLabel, "Galeriye yeni görsel ekle");
  assert.deepEqual(carouselField.labels, {
    singular: "Carousel görseli",
    plural: "Carousel görselleri",
  });
  assert.equal(carouselField.addLabel, "Carousel'e yeni görsel ekle");
});

test("imageArray alanında eksik panel etiketlerini reddeder", () => {
  const definition = getBlockDefinition("gallery");
  const errors = validateDefinitionRegistry([
    {
      ...definition,
      fields: definition.fields.map((field) =>
        field.type === "imageArray" ? { ...field, labels: null } : field
      ),
    },
  ]);

  assert.equal(errors.some((error) => error.includes("dizi panel etiketleri")), true);
});

test("CTA karartmasını varsayılanı açık boolean alanı olarak tanımlar", () => {
  const overlayField = getBlockDefinition("callToAction").fields.find(
    (field) => field.name === "overlay"
  );

  assert.equal(overlayField.type, "boolean");
  assert.equal(overlayField.localized, false);
  assert.equal(overlayField.defaultValue, true);
});

test("boolean alanında geçersiz varsayılan değeri reddeder", () => {
  const definition = getBlockDefinition("callToAction");
  const errors = validateDefinitionRegistry([
    {
      ...definition,
      fields: definition.fields.map((field) =>
        field.type === "boolean" ? { ...field, defaultValue: "true" } : field
      ),
    },
  ]);

  assert.equal(errors.some((error) => error.includes("boolean varsayılan değeri")), true);
});

test("cardCollection grid ve carousel varyantlarını görünüm alanından çözer", () => {
  const definition = getBlockDefinition("cardCollection");

  assert.deepEqual(
    definition.variants.map((variant) => variant.id),
    ["grid", "carousel"]
  );
  assert.equal(getBlockVariant({ type: "cardCollection", displayMode: "grid" }), "grid");
  assert.equal(
    getBlockVariant({ type: "cardCollection", displayMode: "carousel" }),
    "carousel"
  );
});

test("cardCollection görünümünü ve kart kimliklerini doğrular", () => {
  const errors = validateBlock({
    type: "cardCollection",
    displayMode: "liste",
    cards: [
      { id: "same-card", image: "" },
      { id: "same-card", image: null },
    ],
  });

  assert.equal(errors.some((error) => error.includes("grid veya carousel")), true);
  assert.equal(errors.some((error) => error.includes("benzersiz bir id")), true);
  assert.equal(errors.some((error) => error.includes("görsel yolu metin")), true);
});
