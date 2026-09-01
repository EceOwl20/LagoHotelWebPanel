import test from "node:test";
import assert from "node:assert/strict";
import {
  createSectionRendererRegistry,
  resolveSectionRenderer,
  validateSectionRendererRegistry,
} from "./section-renderer-registry.mjs";

function Renderer() {
  return null;
}

function createCompleteRendererMap() {
  return {
    intro: { centered: Renderer },
    imageText: { imageLeft: Renderer, imageRight: Renderer },
    gallery: { horizontal: Renderer },
    carousel: { centered: Renderer },
    callToAction: { image: Renderer },
    cardCollection: { grid: Renderer, carousel: Renderer },
  };
}

test("renderer kayıt sistemi tüm block ve varyantları kapsar", () => {
  const renderers = createCompleteRendererMap();

  assert.deepEqual(validateSectionRendererRegistry(renderers), []);
  assert.doesNotThrow(() => createSectionRendererRegistry(renderers));
});

test("eksik varyant renderer kaydını başlangıçta reddeder", () => {
  const renderers = createCompleteRendererMap();
  delete renderers.imageText.imageRight;

  assert.equal(
    validateSectionRendererRegistry(renderers).some((error) =>
      error.includes("imageText.imageRight")
    ),
    true
  );
});

test("section type ve legacy veriden doğru renderer varyantını çözer", () => {
  const registry = createSectionRendererRegistry(createCompleteRendererMap());
  const resolved = resolveSectionRenderer(registry, {
    type: "imageText",
    imagePosition: "right",
  });

  assert.equal(resolved.Component, Renderer);
  assert.equal(resolved.definition.type, "imageText");
  assert.equal(resolved.variant, "imageRight");
});

test("bilinmeyen section tipi için güvenli şekilde null döner", () => {
  const registry = createSectionRendererRegistry(createCompleteRendererMap());

  assert.equal(resolveSectionRenderer(registry, { type: "unknown" }), null);
});

test("cardCollection görünümüne göre grid veya carousel renderer çözer", () => {
  const registry = createSectionRendererRegistry(createCompleteRendererMap());

  assert.equal(
    resolveSectionRenderer(registry, {
      type: "cardCollection",
      displayMode: "grid",
    }).variant,
    "grid"
  );
  assert.equal(
    resolveSectionRenderer(registry, {
      type: "cardCollection",
      displayMode: "carousel",
    }).variant,
    "carousel"
  );
});
