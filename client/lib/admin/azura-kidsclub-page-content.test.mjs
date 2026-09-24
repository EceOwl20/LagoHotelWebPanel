import assert from "node:assert/strict";
import test from "node:test";
import { KIDS_ACTIVITY_IDS, KIDS_POOL_IDS, KIDS_MOMENT_IDS, AZURA_KIDS_IMAGES } from "./azura-kidsclub-model.mjs";
import { isValidAzuraKidsPage } from "./azura-kidsclub-page-content.mjs";
import { requestAzuraSpaPage } from "./azura-spawellness-page-content.mjs";
import { requestAzuraImages, isValidAzuraImage } from "./azura-experience-images.mjs";

const locales = ["tr", "en", "de", "ru"];
const group = () => ({ subtitle: " Üst ", title: "Başlık", text: "Metin" });
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  hero: group(), info: group(), icons: { environment: "a", activities: "b", social: "c", staff: "d" },
  activities: { ...group(), items: Object.fromEntries(KIDS_ACTIVITY_IDS.map((id, i) =>
    [id, { title: id, repeatTitle: i > 2 ? "" : id }])) },
  pools: { ...group(), cards: Object.fromEntries(KIDS_POOL_IDS.map((id) => [id, group()])) },
  moments: { title: "Anılar" },
}]));
const image = (id, order) => ({ image: "/uploads/pages/kidsclub/example.jpg", width: 800, height: 600,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: "Açıklama" }])),
  ...(id ? { id, order } : {}) });
const media = {
  hero: { image: "/uploads/pages/kidsclub/hero.jpg", width: 800, height: 600 },
  info: { primary: image(), secondary: image() },
  activities: { items: Object.fromEntries(KIDS_ACTIVITY_IDS.map((id, i) => [id, image(id, i)])) },
  pools: Object.fromEntries(KIDS_POOL_IDS.map((id, i) => [id, image(id, i)])),
  moments: { images: KIDS_MOMENT_IDS.map(image) },
};
const revision = "a".repeat(64);
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };

test("Kids exact four-language schema allows only the two optional repeat titles", () => {
  assert.equal(isValidAzuraKidsPage(bundle, media), true);
  for (const edit of [
    (b) => { delete b.ru; },
    (b) => { b.tr.activities.items.activity1.repeatTitle = ""; },
    (b) => { b.tr.activities.items.activity4.repeatTitle = " "; },
    (b) => { b.tr.activities.items.activity5.title = ""; },
    (b) => { b.en.hero.text = "x".repeat(4001); },
    (b) => { b.de.icons.extra = "x"; },
    (b) => { b.ru.info.text = "a\nb"; },
  ]) { const b = structuredClone(bundle); edit(b); assert.equal(isValidAzuraKidsPage(b, media), false); }
});

test("Kids media rejects incorrect identity, order, count, dimensions and foreign paths", () => {
  for (const edit of [
    (m) => { m.hero.translations = image().translations; },
    (m) => { delete m.info.primary.translations; },
    (m) => { m.activities.items.activity2.order = 0; },
    (m) => { m.pools.slide.id = "indoor"; },
    (m) => { m.moments.images.pop(); },
    (m) => { m.moments.images[0].id = "wrong"; },
    (m) => { m.info.primary.image = "/uploads/pages/about/example.jpg"; },
    (m) => { m.info.primary.image = "/uploads/pages/kidsclub/../example.jpg"; },
    (m) => { m.info.primary.width = 0; },
    (m) => { m.info.primary.height = 200000; },
    (m) => { m.info.primary.translations.tr.alt = "x".repeat(301); },
  ]) { const m = structuredClone(media); edit(m); assert.equal(isValidAzuraKidsPage(bundle, m), false); }
  assert.equal(AZURA_KIDS_IMAGES.length + media.moments.images.length, 14);
});

test("Kids proxy forwards server authorization and quoted revision with exact PUT body", async () => {
  const payload = { bundle, media, revision };
  const options = { env, pageKey: "kidsclub", revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/kidsclub/page-content");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    if (init.method === "PUT") {
      assert.equal(init.headers["If-Match"], '"' + revision + '"');
      assert.deepEqual(JSON.parse(init.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  } };
  assert.deepEqual(await requestAzuraSpaPage("GET", undefined, undefined, options), payload);
  assert.deepEqual(await requestAzuraSpaPage("PUT", bundle, media, options), payload);
  await assert.rejects(requestAzuraSpaPage("PUT", bundle, media, { ...options, revision: undefined }), (e) => e.status === 400);
  await assert.rejects(requestAzuraSpaPage("PUT", bundle, media, { ...options,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Conflict" }) }) }), (e) => e.status === 409);
});

test("Kids media uses isolated paths and the shared upload/list contract", async () => {
  const asset = { image: "/uploads/pages/kidsclub/new.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "kidsclub"), true);
  assert.equal(isValidAzuraImage(asset, false, "beachpools"), false);
  const options = { env, scope: "kidsclub", fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/kidsclub/images");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => init.method === "GET"
      ? { images: [{ ...asset, modifiedAt: "2026-09-24T00:00:00Z" }] } : asset };
  } };
  assert.equal((await requestAzuraImages("GET", undefined, options))[0].previewUrl, "http://localhost:3001" + asset.image);
  assert.equal((await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), options)).image, asset.image);
});
