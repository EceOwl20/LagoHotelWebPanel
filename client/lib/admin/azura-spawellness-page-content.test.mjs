import assert from "node:assert/strict";
import test from "node:test";
import { SPA_GALLERY_IDS, SPA_MASSAGE_IDS, getAzuraSpaPageConnection, isValidAzuraSpaPage, requestAzuraSpaPage } from "./azura-spawellness-page-content.mjs";
import { getAzuraImagesConnection, isValidAzuraImage, requestAzuraImages } from "./azura-experience-images.mjs";

const locales = ["tr", "en", "de", "ru"];
const revision = "a".repeat(64);
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };
const text = { subtitle: "Üst başlık", title: "Başlık", text: " Açıklama " };
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  hero: { ...text }, info: { intro: { ...text }, sauna: { ...text },
    wellness: { ...text, ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`list${i + 1}`, "Madde"])) } },
  gallery: { ...text }, massage: { ...text, time: "09:00–20:00",
    cards: Object.fromEntries(SPA_MASSAGE_IDS.map((id) => [id, { title: id }])) },
  types: { indoor: { ...text }, turkishBath: { ...text } },
}]));
const image = (name) => ({ image: `/uploads/pages/spawellness/${name}.jpg`, width: 800, height: 600,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: `${name} ${locale}` }])) });
const collection = (ids) => ({ images: ids.map((id, order) => ({ id, order, ...image(id) })) });
const media = { hero: image("hero"), info: { wellness: image("wellness"), sauna: image("sauna") },
  gallery: collection(SPA_GALLERY_IDS), massage: collection(SPA_MASSAGE_IDS),
  types: { indoor: image("indoor"), turkishBath: image("hamam") } };

test("Spa dört dil, yedi liste maddesi ve 14 görselle doğrulanır", () => {
  assert.equal(isValidAzuraSpaPage(bundle, media), true);
  for (const change of [
    (b) => { delete b.ru; },
    (b) => { delete b.tr.info.wellness.list7; },
    (b) => { b.tr.hero.title = ""; },
    (b) => { b.tr.massage.time = "x".repeat(4001); },
    (b) => { b.tr.hero.text += "\n"; },
    (b) => { b.tr.types.extra = {}; },
  ]) { const copy = structuredClone(bundle); change(copy); assert.equal(isValidAzuraSpaPage(copy, media), false); }
  assert.equal(isValidAzuraSpaPage(bundle, { ...media, hero: { ...media.hero, image: "/uploads/pages/about/hero.jpg" } }), false);
  assert.equal(isValidAzuraSpaPage(bundle, { ...media, hero: { ...media.hero, width: 0 } }), false);
});

test("Spa galeri ve masaj kimlikleri/sıraları başlık eşleşmesini korur", () => {
  for (const key of ["gallery", "massage"]) {
    const copy = structuredClone(media);
    copy[key].images.reverse();
    assert.equal(isValidAzuraSpaPage(bundle, copy), false);
    copy[key].images.pop();
    assert.equal(isValidAzuraSpaPage(bundle, copy), false);
  }
  const copy = structuredClone(bundle);
  delete copy.tr.massage.cards[SPA_MASSAGE_IDS[0]];
  copy.tr.massage.cards.other = { title: "Yanlış kimlik" };
  assert.equal(isValidAzuraSpaPage(copy, media), false);
});

test("Spa adresleri yalnızca doğrulanmış Azura bağlantısından türetilir", () => {
  assert.equal(getAzuraSpaPageConnection(env).url, "http://localhost:3001/api/azura/spawellness/page-content");
  assert.equal(getAzuraImagesConnection(env, "spawellness").url, "http://localhost:3001/api/azura/spawellness/images");
  assert.throws(() => getAzuraSpaPageConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience" }));
});

test("Spa GET ve PUT doğru Bearer/If-Match ve yalnızca bundle/media ile iletilir", async () => {
  const payload = { bundle, media, revision };
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/spawellness/page-content");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  };
  assert.deepEqual(await requestAzuraSpaPage("GET", undefined, undefined, { env, fetchImpl }), payload);
  assert.deepEqual(await requestAzuraSpaPage("PUT", bundle, media, { env, fetchImpl, revision }), payload);
  await assert.rejects(requestAzuraSpaPage("PUT", bundle, media, { env, fetchImpl }), /sürümü geçersiz/);
});

test("Spa bozuk yanıtı ve 409 çakışması başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraSpaPage("GET", undefined, undefined, {
    env, fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media, revision: "bad" }) }),
  }), /beklenen içerik/);
  await assert.rejects(requestAzuraSpaPage("PUT", bundle, media, {
    env, revision, fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm." }) }),
  }), (error) => error.status === 409);
});

test("Spa görselleri kendi endpoint'inden listelenir ve yüklenir", async () => {
  const asset = { image: "/uploads/pages/spawellness/hero.jpg", mimeType: "image/jpeg", size: 100, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "spawellness"), true);
  assert.equal(isValidAzuraImage(asset, false, "about"), false);
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/spawellness/images");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    if (options.method === "POST") assert.equal(options.body.get("file").name, "spa.jpg");
    return { ok: true, json: async () => options.method === "POST" ? asset : {
      images: [{ ...asset, modifiedAt: "2026-09-19T12:00:00.000Z" }],
    } };
  };
  const images = await requestAzuraImages("GET", undefined, { env, scope: "spawellness", fetchImpl });
  assert.equal(images[0].previewUrl, "http://localhost:3001/uploads/pages/spawellness/hero.jpg");
  const result = await requestAzuraImages("POST", new File(["image"], "spa.jpg", { type: "image/jpeg" }), { env, scope: "spawellness", fetchImpl });
  assert.equal(result.image, asset.image);
});
