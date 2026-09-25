import assert from "node:assert/strict";
import test from "node:test";
import { SPA_GALLERY_IDS, SPA_MASSAGE_IDS } from "./azura-spawellness-page-content.mjs";
import { SPOR_GALLERY_IDS } from "./azura-spor-page-content.mjs";
import { getAzuraPageContentConnection, isValidAzuraPageContent, requestAzuraPageContent } from "./azura-page-content.mjs";
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

function sporFixture() {
  const b = structuredClone(bundle);
  for (const t of Object.values(b)) {
    delete t.massage;
    for (const key of ["list5", "list6", "list7"]) delete t.info.wellness[key];
    t.types = { fitness: { ...text }, personalTrainer: { title: "Antrenör", text: "Açıklama" } };
  }
  const img = (name) => ({ ...image(name), image: `/uploads/pages/spor/${name}.jpg` });
  return { bundle: b, media: { hero: img("hero"), info: { wellness: img("wellness"), sauna: img("sauna") },
    gallery: { images: SPOR_GALLERY_IDS.map((id, order) => ({ ...img(id), id, order })) },
    types: { fitness: img("fitness"), personalTrainer: img("trainer") } } };
}

test("Spor kesin şema: dört liste maddesi, üç galeri, sekiz görsel ve masaj yok", () => {
  const f = sporFixture();
  assert.equal(isValidAzuraPageContent(f.bundle, f.media, "spor"), true);
  assert.equal(isValidAzuraPageContent(f.bundle, f.media), false);
  assert.equal(isValidAzuraPageContent(bundle, media, "spor"), false);
  assert.equal(isValidAzuraPageContent(bundle, media, "unknown"), false);
  for (const edit of [
    (p) => { p.bundle.tr.massage = {}; },
    (p) => { p.media.massage = {}; },
    (p) => { p.bundle.tr.types.personalTrainer.subtitle = "Gizli alan"; },
    (p) => { delete p.bundle.tr.info.wellness.list4; },
    (p) => { p.bundle.tr.info.wellness.list5 = "fazla"; },
    (p) => { p.media.gallery.images.reverse(); },
    (p) => { p.media.gallery.images.pop(); },
    (p) => { p.media.hero.image = "/uploads/pages/spawellness/hero.jpg"; },
    (p) => { p.media.hero.width = 5472; p.media.hero.height = 3648; },
    (p) => { p.bundle.ru.hero.title = "x".repeat(4001); },
    (p) => { delete p.bundle.de; },
  ]) {
    const copy = structuredClone(f); edit(copy);
    assert.equal(isValidAzuraPageContent(copy.bundle, copy.media, "spor"), false);
  }
  f.media.gallery.images[2].width = 4800;
  f.media.gallery.images[2].height = 3200;
  assert.equal(isValidAzuraPageContent(f.bundle, f.media, "spor"), true);
});

test("Spor proxy yalnızca kendi endpoint'ine token ve If-Match gönderir", async () => {
  const f = sporFixture(), payload = { ...f, revision };
  const options = { env, pageKey: "spor", revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/spor/page-content");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    if (init.method === "PUT") {
      assert.equal(init.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(init.body), f);
    }
    return { ok: true, json: async () => payload };
  } };
  assert.deepEqual(await requestAzuraPageContent("GET", undefined, undefined, options), payload);
  assert.deepEqual(await requestAzuraPageContent("PUT", f.bundle, f.media, options), payload);
  await assert.rejects(requestAzuraPageContent("PUT", f.bundle, f.media, { ...options, revision: undefined }), (e) => e.status === 400);
  assert.throws(() => getAzuraPageContentConnection(env, "../spor"), (e) => e.status === 404);
});

test("Spor 409 ve hatalı yanıtları başarı kabul etmez", async () => {
  const f = sporFixture();
  await assert.rejects(requestAzuraPageContent("PUT", f.bundle, f.media, { env, pageKey: "spor", revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm" }) }) }), (e) => e.status === 409);
  await assert.rejects(requestAzuraPageContent("GET", undefined, undefined, { env, pageKey: "spor",
    fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media, revision }) }) }), /beklenen içerik/);
});

test("Spor medya listesi ve yüklemesi başka sayfa yollarını kabul etmez", async () => {
  const scope = "spor";
  const asset = { image: "/uploads/pages/spor/new.jpg", mimeType: "image/jpeg", size: 100, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, scope), true);
  assert.equal(isValidAzuraImage({ ...asset, image: "/uploads/pages/spawellness/new.jpg" }, false, scope), false);
  assert.equal(isValidAzuraImage({ ...asset, image: "/uploads/pages/spor/../new.jpg" }, false, scope), false);
  const fetchImpl = async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/spor/images");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => init.method === "GET" ?
      { images: [{ ...asset, modifiedAt: "2026-09-23T00:00:00Z" }] } : asset };
  };
  const list = await requestAzuraImages("GET", undefined, { env, scope, fetchImpl });
  assert.equal(list[0].previewUrl, "http://localhost:3001/uploads/pages/spor/new.jpg");
  assert.equal((await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), { env, scope, fetchImpl })).image, asset.image);
});

test("Spa dört dil, yedi liste maddesi ve 14 görselle doğrulanır", () => {
  assert.equal(isValidAzuraPageContent(bundle, media), true);
  for (const change of [
    (b) => { delete b.ru; },
    (b) => { delete b.tr.info.wellness.list7; },
    (b) => { b.tr.hero.title = ""; },
    (b) => { b.tr.massage.time = "x".repeat(4001); },
    (b) => { b.tr.hero.text += "\n"; },
    (b) => { b.tr.types.extra = {}; },
  ]) { const copy = structuredClone(bundle); change(copy); assert.equal(isValidAzuraPageContent(copy, media), false); }
  assert.equal(isValidAzuraPageContent(bundle, { ...media, hero: { ...media.hero, image: "/uploads/pages/about/hero.jpg" } }), false);
  assert.equal(isValidAzuraPageContent(bundle, { ...media, hero: { ...media.hero, width: 0 } }), false);
});

test("Spa galeri ve masaj kimlikleri/sıraları başlık eşleşmesini korur", () => {
  for (const key of ["gallery", "massage"]) {
    const copy = structuredClone(media);
    copy[key].images.reverse();
    assert.equal(isValidAzuraPageContent(bundle, copy), false);
    copy[key].images.pop();
    assert.equal(isValidAzuraPageContent(bundle, copy), false);
  }
  const copy = structuredClone(bundle);
  delete copy.tr.massage.cards[SPA_MASSAGE_IDS[0]];
  copy.tr.massage.cards.other = { title: "Yanlış kimlik" };
  assert.equal(isValidAzuraPageContent(copy, media), false);
});

test("Spa adresleri yalnızca doğrulanmış Azura bağlantısından türetilir", () => {
  assert.equal(getAzuraPageContentConnection(env).url, "http://localhost:3001/api/azura/spawellness/page-content");
  assert.equal(getAzuraImagesConnection(env, "spawellness").url, "http://localhost:3001/api/azura/spawellness/images");
  assert.throws(() => getAzuraPageContentConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience" }));
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
  assert.deepEqual(await requestAzuraPageContent("GET", undefined, undefined, { env, fetchImpl }), payload);
  assert.deepEqual(await requestAzuraPageContent("PUT", bundle, media, { env, fetchImpl, revision }), payload);
  await assert.rejects(requestAzuraPageContent("PUT", bundle, media, { env, fetchImpl }), /sürümü geçersiz/);
});

test("Spa bozuk yanıtı ve 409 çakışması başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraPageContent("GET", undefined, undefined, {
    env, fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media, revision: "bad" }) }),
  }), /beklenen içerik/);
  await assert.rejects(requestAzuraPageContent("PUT", bundle, media, {
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
