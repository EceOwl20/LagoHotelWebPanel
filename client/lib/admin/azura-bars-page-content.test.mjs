import assert from "node:assert/strict";
import test from "node:test";
import { AZURA_BAR_IDS, AZURA_BAR_IMAGES } from "./azura-bars-model.mjs";
import { isValidAzuraBarsPage } from "./azura-bars-page-content.mjs";
import { requestAzuraPageContent } from "./azura-page-content.mjs";
import { requestAzuraImages, isValidAzuraImage } from "./azura-experience-images.mjs";
const locales = ["tr", "en", "de", "ru"];
const group = () => ({ subtitle: " Üst ", title: "Başlık", text: "Metin" });
const bundle = Object.fromEntries(locales.map((l) => [l, {
  hero: group(), culinaryInfo: group(), featureBackgrounds: { bars: group() },
  bars: { ...group(), cards: Object.fromEntries(AZURA_BAR_IDS.map((id) => [id, group()])) }, discover: group(),
}]));
const image = (alt = true) => ({ image: "/uploads/pages/bars/test.jpg", width: 800, height: 600,
  ...(alt ? { translations: Object.fromEntries(locales.map((l) => [l, { alt: "Alt" }])) } : {}) });
const media = { hero: image(false), culinaryInfo: { primary: image(), secondary: image() },
  featureBackgrounds: { bars: image(false) }, bars: Object.fromEntries(AZURA_BAR_IDS.map((id, order) =>
    [id, { ...image(), id, order }])), discover: image(false) };
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };
const revision = "a".repeat(64);

test("Bars exact four-language contract rejects empty, missing and extra fields", () => {
  assert.equal(isValidAzuraBarsPage(bundle, media), true);
  for (const edit of [
    (b) => { delete b.ru; }, (b) => { b.tr.hero.title = ""; },
    (b) => { b.en.hero.text = "x".repeat(4001); },
    (b) => { b.de.cafes = {}; }, (b) => { delete b.tr.bars.cards.pier; },
  ]) { const b = structuredClone(bundle); edit(b); assert.equal(isValidAzuraBarsPage(b, media), false); }
});
test("Bars nine media records preserve six alt fields, identities, order and isolation", () => {
  assert.equal(AZURA_BAR_IMAGES.length, 9);
  assert.equal(AZURA_BAR_IMAGES.filter((f) => f.localizedAlt !== false).length, 6);
  for (const edit of [
    (m) => { m.hero.translations = image().translations; },
    (m) => { m.discover.translations = image().translations; },
    (m) => { m.featureBackgrounds.bars.translations = image().translations; },
    (m) => { delete m.bars.pier.translations; },
    (m) => { m.bars.chacha.order = 0; }, (m) => { m.bars.pier.id = "chacha"; },
    (m) => { m.bars.pier.image = "/uploads/pages/barcafes/test.jpg"; },
    (m) => { m.bars.pier.image = "/uploads/pages/bars/../test.jpg"; },
    (m) => { m.bars.pier.width = 0; }, (m) => { m.bars.pier.height = 200000; },
    (m) => { m.bars.pier.translations.tr.alt = "x".repeat(301); },
  ]) { const m = structuredClone(media); edit(m); assert.equal(isValidAzuraBarsPage(bundle, m), false); }
});
test("Bars GET/PUT forwards exact body, server token and quoted revision", async () => {
  const payload = { bundle, media, revision };
  const options = { env, pageKey: "bars", revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/bars/page-content");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    if (init.method === "PUT") {
      assert.equal(init.headers["If-Match"], '"' + revision + '"');
      assert.deepEqual(JSON.parse(init.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  } };
  assert.deepEqual(await requestAzuraPageContent("GET", undefined, undefined, options), payload);
  assert.deepEqual(await requestAzuraPageContent("PUT", bundle, media, options), payload);
  await assert.rejects(requestAzuraPageContent("PUT", bundle, media, { ...options, revision: undefined }), (e) => e.status === 400);
  await assert.rejects(requestAzuraPageContent("PUT", bundle, media, { ...options,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Conflict" }) }) }), (e) => e.status === 409);
});
test("Bars image list and upload use only the bars endpoint", async () => {
  const asset = { image: "/uploads/pages/bars/new.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "bars"), true);
  assert.equal(isValidAzuraImage(asset, false, "kidsclub"), false);
  const options = { env, scope: "bars", fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/bars/images");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => init.method === "GET"
      ? { images: [{ ...asset, modifiedAt: "2026-09-25T00:00:00Z" }] } : asset };
  } };
  assert.equal((await requestAzuraImages("GET", undefined, options))[0].previewUrl, "http://localhost:3001" + asset.image);
  assert.equal((await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), options)).image, asset.image);
});
