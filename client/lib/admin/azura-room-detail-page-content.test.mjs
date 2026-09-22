import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ROOM_FEATURE_IDS, isValidRoomTourUrl, isValidAzuraRoomDetailPage, getAzuraRoomDetailConnection, requestAzuraRoomDetailPage } from "./azura-room-detail-page-content.mjs";
import { azuraRoomDetailConfig, LAGO_ROOM_DETAIL_CONFIGS, canSelectRoomDetailImage } from "./room-detail-model.mjs";
import { getAzuraImagesConnection, isValidAzuraImage, requestAzuraImages } from "./azura-experience-images.mjs";

const config = azuraRoomDetailConfig("deluxe");
const locales = ["tr", "en", "de", "ru"];
const fields = (names) => Object.fromEntries(names.map((name) => [name, ` ${name} metni `]));
const group = () => fields(["subtitle", "title", "text"]);
const bundle = { translations: Object.fromEntries(locales.map((locale) => [locale, {
  ...fields(["subtitle", "title", "text1", "text2", "text3"]),
  RoomInfo: { ...fields(["subtitle", "title", "text", "title2", "title3", "text2"]),
    amenities: fields(["doubleBed", "singleBed", "sofa"]), features: fields(ROOM_FEATURE_IDS) },
  BackgroundSection: group(), RoomTour: Object.fromEntries(config.tourIds.map((id) => [id, group()])),
  OtherOptions: { ...fields(["span", "title", "buttonText"]),
    cards: Object.fromEntries(config.optionIds.map((id) => [id, fields(["subtitle", "title", "m", "capacity", "text"])])) },
}])), tours: config.tourIds.map((id, order) => ({ id, order, url: "https://kuula.co/share/collection/7by5f?logo=1&alph" })) };
const image = (name) => ({ image: `/uploads/pages/deluxeroom/${name}.jpg`, width: 800, height: 600,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: "Oda görseli" }])) });
const collection = (ids) => ({ images: ids.map((id, order) => ({ id, order, ...image(id) })) });
const media = { hero: image("hero"), background: image("background"), gallery: collection(config.galleryIds), otherOptions: collection(config.optionIds) };
media.otherOptions.images[1].image = "/uploads/pages/room-options/fantasy-preview.jpg";
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };
const revision = "a".repeat(64);

function familyFixture() {
  const family = azuraRoomDetailConfig("family");
  const b = structuredClone(bundle);
  for (const t of Object.values(b.translations)) {
    t.BackgroundSection = fields(family.backgroundFields);
    delete t.RoomTour.partialSea;
    t.OtherOptions.cards.deluxe = t.OtherOptions.cards.family;
    delete t.OtherOptions.cards.family;
  }
  b.tours = b.tours.slice(0, 2);
  const img = (name) => ({ ...image(name), image: `/uploads/pages/familyroom/${name}.jpg` });
  const list = (ids) => ({ images: ids.map((id, order) => ({ ...img(id), id, order })) });
  return { bundle: b, media: { hero: img("hero"), background: img("background"),
    gallery: list(family.galleryIds), otherOptions: list(family.optionIds) } };
}

test("Family şeması Deluxe'den bağımsız 12 galeri, 2 tur ve liste alanlarını doğrular", () => {
  const f = familyFixture();
  assert.equal(isValidAzuraRoomDetailPage("family", f.bundle, f.media), true);
  assert.equal(isValidAzuraRoomDetailPage("deluxe", f.bundle, f.media), false);
  assert.equal(isValidAzuraRoomDetailPage("family", bundle, media), false);
  for (const edit of [
    (p) => { delete p.bundle.translations.tr.BackgroundSection.list2; },
    (p) => { p.bundle.tours.reverse(); },
    (p) => { p.media.gallery.images.pop(); },
    (p) => { p.media.otherOptions.images.reverse(); },
    (p) => { p.media.hero.image = "/uploads/pages/deluxeroom/hero.jpg"; },
    (p) => { p.media.hero.image = "/uploads/pages/room-options/deluxe-preview.jpg"; },
    (p) => { p.media.parallax = p.media.hero; },
  ]) {
    const copy = structuredClone(f); edit(copy);
    assert.equal(isValidAzuraRoomDetailPage("family", copy.bundle, copy.media), false);
  }
  f.media.otherOptions.images[0].image = "/uploads/pages/room-options/deluxe-preview.jpg";
  assert.equal(isValidAzuraRoomDetailPage("family", f.bundle, f.media), true);
});

test("Family GET/PUT doğru endpoint ve revision kullanır; 409 korunur", async () => {
  const f = familyFixture();
  const payload = { ...f, revision };
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/room-details/family/page-content");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), f);
    }
    return { ok: true, json: async () => payload };
  };
  assert.deepEqual(await requestAzuraRoomDetailPage("family", "GET", undefined, undefined, { env, fetchImpl }), payload);
  assert.deepEqual(await requestAzuraRoomDetailPage("family", "PUT", f.bundle, f.media, { env, fetchImpl, revision }), payload);
  await assert.rejects(requestAzuraRoomDetailPage("family", "PUT", f.bundle, f.media, { env, revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm" }) }) }), (error) => error.status === 409);
});

test("Family medya kapsamı Deluxe dosyalarını ve ortak dizine yüklemeyi reddeder", async () => {
  const family = azuraRoomDetailConfig("family");
  const scope = family.imagesScope;
  assert.equal(getAzuraImagesConnection(env, scope).url, "http://localhost:3001/api/azura/room-details/family/images");
  const uploaded = { image: "/uploads/pages/familyroom/new.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  const shared = { ...uploaded, image: "/uploads/pages/room-options/deluxe-preview.jpg" };
  const listed = { ...shared, modifiedAt: "2026-09-21T00:00:00Z" };
  assert.equal(isValidAzuraImage(uploaded, false, scope), true);
  assert.equal(isValidAzuraImage(shared, false, scope), false);
  assert.equal(isValidAzuraImage(listed, true, scope), true);
  assert.equal(isValidAzuraImage({ ...listed, image: "/uploads/pages/deluxeroom/hero.jpg" }, true, scope), false);
  assert.equal(canSelectRoomDetailImage(family, { path: ["hero"] }, shared), false);
  assert.equal(canSelectRoomDetailImage(family, { path: ["otherOptions"] }, shared), true);
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/room-details/family/images");
    return { ok: true, json: async () => options.method === "GET" ? { images: [listed] } : uploaded };
  };
  assert.equal((await requestAzuraImages("GET", undefined, { env, scope, fetchImpl })).length, 1);
  await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), { env, scope, fetchImpl });
});

test("Deluxe kesin şeması ve yalnızca etkin oda izin listesi", () => {
  assert.equal(isValidAzuraRoomDetailPage("deluxe", bundle, media), true);
  for (const key of ["fantasy", "../deluxe", "__proto__", "toString"]) {
    assert.equal(azuraRoomDetailConfig(key), null);
    assert.equal(isValidAzuraRoomDetailPage(key, bundle, media), false);
    assert.throws(() => getAzuraRoomDetailConnection(key, env), (error) => error.status === 404);
  }
  for (const edit of [
    (b) => { delete b.translations.ru; },
    (b) => { b.translations.tr.title = "<script>"; },
    (b) => { delete b.translations.tr.RoomInfo.features.area; },
    (b) => { b.translations.tr.OtherOptions.cards.deluxe = b.translations.tr.OtherOptions.cards.family; },
    (b) => { b.tours.reverse(); },
  ]) { const copy = structuredClone(bundle); edit(copy); assert.equal(isValidAzuraRoomDetailPage("deluxe", copy, media), false); }
});

test("Dokuz galeri, iki öneri, üç tur ve medya dizin sınırları korunur", () => {
  for (const edit of [
    (m) => { m.gallery.images.pop(); },
    (m) => { m.otherOptions.images.reverse(); },
    (m) => { m.hero.image = "/uploads/pages/room-options/fantasy-preview.jpg"; },
    (m) => { m.gallery.images[0].image = "/uploads/pages/familyroom/hero.jpg"; },
    (m) => { m.background.width = 0; },
    (m) => { m.parallax = image("parallax"); },
  ]) { const copy = structuredClone(media); edit(copy); assert.equal(isValidAzuraRoomDetailPage("deluxe", bundle, copy), false); }
});

test("Kuula tur adresi ve parametreleri güvenli sözleşmeyle sınırlandırılır", () => {
  assert.equal(isValidRoomTourUrl(bundle.tours[0].url), true);
  for (const url of ["javascript:alert(1)", "https://evil.test/share/collection/7by5f", "https://kuula.co.evil.test/share/collection/7by5f",
    "https://kuula.co/share/collection/7by5f?logo=1&logo=0", "https://kuula.co/share/collection/7by5f#x", "https://kuula.co/share/collection/7by5f?unknown=1",
    "https://kuula.co/share/collection/7by5f?alpha=2", "https://kuula.co/share/collection/7by5f?logo=<script>"]) {
    assert.equal(isValidRoomTourUrl(url), false, url);
  }
});

test("Lago oda yapılandırması mevcut tüm oda medyalarını korur", () => {
  for (const room of Object.values(LAGO_ROOM_DETAIL_CONFIGS)) {
    const content = JSON.parse(readFileSync(new URL(`../../content/site-pages/${room.pageKey}.json`, import.meta.url), "utf8"));
    assert.ok(content.hero.image);
    assert.ok(Array.isArray(content.gallery.images));
    assert.equal(Boolean(content.background), room.background);
  }
});

test("Ortak öneri görselleri yalnızca öneri alanlarında seçilebilir", () => {
  const shared = { image: "/uploads/pages/room-options/fantasy-preview.jpg" };
  assert.equal(canSelectRoomDetailImage(config, { path: ["hero"] }, shared), false);
  assert.equal(canSelectRoomDetailImage(config, { path: ["gallery"] }, shared), false);
  assert.equal(canSelectRoomDetailImage(config, { path: ["otherOptions"] }, shared), true);
  assert.equal(canSelectRoomDetailImage(config, { path: ["hero"] }, media.hero), true);
});

test("Oda GET/PUT yalnızca doğru endpoint, token ve If-Match ile iletilir", async () => {
  const payload = { bundle, media, revision };
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/room-details/deluxe/page-content");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  };
  assert.deepEqual(await requestAzuraRoomDetailPage("deluxe", "GET", undefined, undefined, { env, fetchImpl }), payload);
  assert.deepEqual(await requestAzuraRoomDetailPage("deluxe", "PUT", bundle, media, { env, fetchImpl, revision }), payload);
  await assert.rejects(requestAzuraRoomDetailPage("deluxe", "PUT", bundle, media, { env, fetchImpl }), (error) => error.status === 400);
  await assert.rejects(requestAzuraRoomDetailPage("fantasy", "GET", undefined, undefined, { env, fetchImpl }), (error) => error.status === 404);
});

test("409 veya bozuk API yanıtı başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraRoomDetailPage("deluxe", "PUT", bundle, media, { env, revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm" }) }) }), (error) => error.status === 409);
  await assert.rejects(requestAzuraRoomDetailPage("deluxe", "GET", undefined, undefined, { env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media, revision: "bad" }) }) }), /beklenen içeriği/);
});

test("Deluxe medyası ortak görselleri listeler ama ortak dizine yükleme yanıtını reddeder", async () => {
  const scope = config.imagesScope;
  assert.equal(getAzuraImagesConnection(env, scope).url, "http://localhost:3001/api/azura/room-details/deluxe/images");
  const shared = { image: "/uploads/pages/room-options/fantasy-preview.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  const uploaded = { ...shared, image: "/uploads/pages/deluxeroom/new.jpg" };
  assert.equal(isValidAzuraImage({ ...shared, modifiedAt: "2026-09-21T00:00:00Z" }, true, scope), true);
  assert.equal(isValidAzuraImage(shared, false, scope), false);
  assert.equal(isValidAzuraImage({ ...shared, image: 123 }, false, scope), false);
  assert.equal(isValidAzuraImage(uploaded, false, scope), true);
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/room-details/deluxe/images");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => options.method === "GET" ? { images: [{ ...shared, modifiedAt: "2026-09-21T00:00:00Z" }] } : uploaded };
  };
  const images = await requestAzuraImages("GET", undefined, { env, scope, fetchImpl });
  assert.equal(images[0].previewUrl, `http://localhost:3001${shared.image}`);
  await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), { env, scope, fetchImpl });
});
