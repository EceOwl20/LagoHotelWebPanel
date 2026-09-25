import assert from "node:assert/strict";
import test from "node:test";
import { ENTERTAINMENT_ACTIVITY_IDS, ENTERTAINMENT_GRID_IDS, AZURA_ENTERTAINMENT_IMAGES } from "./azura-entertainment-model.mjs";
import { isValidAzuraEntertainmentPage } from "./azura-entertainment-page-content.mjs";
import { requestAzuraPageContent } from "./azura-page-content.mjs";
import { requestAzuraImages, isValidAzuraImage } from "./azura-experience-images.mjs";
const locales = ["tr", "en", "de", "ru"];
const group = () => ({ subtitle: " Üst ", title: "Başlık", text: "Metin" });
const bundle = Object.fromEntries(locales.map((l) => [l, {
  activities: { ...group(), span1: "Bir", span2: "İki", daytime: "Gündüz", nighttime: "Gece" },
  gridSection: { ...group(), ...Object.fromEntries(Array.from({length:9},(_,i)=>[["title"+(i+1),"Başlık"],["text"+(i+1),"Metin"]]).flat()), daytime: "Gündüz", nighttime: "Gece" },
}]));
const image = (alt = true) => ({ image: "/uploads/pages/entertainment/test.jpg", width: 800, height: 600,
  ...(alt ? { translations: Object.fromEntries(locales.map((l) => [l, { alt: "Alt" }])) } : {}) });
const media = { hero: image(false),
  activities: ENTERTAINMENT_ACTIVITY_IDS.map((id,order)=>({...image(),id,order})),
  gridSection: ENTERTAINMENT_GRID_IDS.map((id,order)=>({...image(),id,order})),
};
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };
const revision = "a".repeat(64);

test("Entertainment exact four-language contract rejects empty, missing and extra fields", () => {
  assert.equal(isValidAzuraEntertainmentPage(bundle, media), true);
  for (const edit of [
    (b) => { delete b.ru; }, (b) => { b.tr.activities.title = ""; },
    (b) => { b.en.gridSection.text = "x".repeat(4001); },
    (b) => { b.de.cafes = {}; }, (b) => { delete b.tr.gridSection.title9; },
  ]) { const b = structuredClone(bundle); edit(b); assert.equal(isValidAzuraEntertainmentPage(b, media), false); }
});
test("Entertainment twelve media records preserve eleven alt fields, identities, order and isolation", () => {
  assert.equal(AZURA_ENTERTAINMENT_IMAGES.length, 12);
  assert.equal(AZURA_ENTERTAINMENT_IMAGES.filter((f) => f.localizedAlt !== false).length, 11);
  for (const edit of [
    (m) => { m.hero.translations = image().translations; },
    (m) => { m.activities = Object.assign({}, m.activities); },
    (m) => { m.gridSection.pop(); },
    (m) => { delete m.gridSection[0].translations; },
    (m) => { m.activities[1].order = 0; }, (m) => { m.gridSection[0].id = "chacha"; },
    (m) => { m.gridSection[0].image = "/uploads/pages/barcafes/test.jpg"; },
    (m) => { m.gridSection[0].image = "/uploads/pages/entertainment/../test.jpg"; },
    (m) => { m.gridSection[0].width = 0; }, (m) => { m.gridSection[0].height = 200000; },
    (m) => { m.gridSection[0].translations.tr.alt = "x".repeat(301); },
  ]) { const m = structuredClone(media); edit(m); assert.equal(isValidAzuraEntertainmentPage(bundle, m), false); }
});
test("Entertainment GET/PUT forwards exact body, server token and quoted revision", async () => {
  const payload = { bundle, media, revision };
  const options = { env, pageKey: "entertainment", revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/entertainment/page-content");
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
test("Entertainment image list and upload use only the entertainment endpoint", async () => {
  const asset = { image: "/uploads/pages/entertainment/new.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "entertainment"), true);
  assert.equal(isValidAzuraImage(asset, false, "kidsclub"), false);
  const options = { env, scope: "entertainment", fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/entertainment/images");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => init.method === "GET"
      ? { images: [{ ...asset, modifiedAt: "2026-09-25T00:00:00Z" }] } : asset };
  } };
  assert.equal((await requestAzuraImages("GET", undefined, options))[0].previewUrl, "http://localhost:3001" + asset.image);
  assert.equal((await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), options)).image, asset.image);
});
