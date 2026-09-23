import assert from "node:assert/strict";
import test from "node:test";
import { BEACH_ACTIVITY_IDS, BEACH_POOL_IDS, AZURA_BEACH_IMAGES } from "./azura-beachpools-model.mjs";
import { isValidAzuraBeachPage } from "./azura-beachpools-page-content.mjs";
import { requestAzuraSpaPage } from "./azura-spawellness-page-content.mjs";
import { requestAzuraImages, isValidAzuraImage } from "./azura-experience-images.mjs";

const locales = ["tr", "en", "de", "ru"];
const fields = (keys) => Object.fromEntries(keys.map((k) => [k, ` ${k} metni `]));
const group = () => fields(["subtitle", "title", "text"]);
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  hero: group(), info: { ...group(), ...fields(["span", "list1", "list2", "list3"]) },
  activities: { ...group(), cards: Object.fromEntries(BEACH_ACTIVITY_IDS.map((id) => [id, fields(["title", "span"])])) },
  video: group(), pools: { ...group(), cards: Object.fromEntries(BEACH_POOL_IDS.map((id) =>
    [id, { ...group(), ...fields(["outdoor", "area", "depth"]) }])) },
}]));
const image = (name, alt = true) => ({ image: `/uploads/pages/beachpools/${name}.jpg`, width: 800, height: 600,
  ...(alt ? { translations: Object.fromEntries(locales.map((locale) => [locale, { alt: "Görsel açıklaması" }])) } : {}) });
const media = { hero: { desktopBackground: image("hero", false) },
  info: { primary: image("primary"), secondary: image("secondary") },
  activities: Object.fromEntries(BEACH_ACTIVITY_IDS.map((id, order) => [id, { ...image(id), id, order }])),
  pools: Object.fromEntries(BEACH_POOL_IDS.map((id, order) => [id, { id, order, image: image(id), hover: image(id + "-hover", false) }])),
};
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };
const revision = "a".repeat(64);

test("Beach dört dil, dört aktivite ve beş havuz sözleşmesini doğrular", () => {
  assert.equal(isValidAzuraBeachPage(bundle, media), true);
  for (const edit of [
    (b) => { delete b.ru; },
    (b) => { b.tr.hero.title = ""; },
    (b) => { b.tr.info.list4 = "fazla"; },
    (b) => { b.tr.video.url = "/videos/other.mp4"; },
    (b) => { delete b.tr.activities.cards.activity4; },
    (b) => { b.tr.pools.cards.extra = b.tr.pools.cards.main; },
    (b) => { b.en.hero.text = "x".repeat(4001); },
  ]) { const b = structuredClone(bundle); edit(b); assert.equal(isValidAzuraBeachPage(b, media), false); }
});

test("Beach CSS/normal görsel ayrımı, kimlikler, sıralar ve yol sınırları korunur", () => {
  for (const edit of [
    (m) => { m.hero.desktopBackground.translations = image("x").translations; },
    (m) => { m.pools.main.hover.translations = image("x").translations; },
    (m) => { delete m.pools.main.image.translations; },
    (m) => { m.pools.main.image.id = "main"; },
    (m) => { m.pools.main.order = 1; },
    (m) => { m.activities.activity2.order = 0; },
    (m) => { m.activities.activity1.id = "activity2"; },
    (m) => { m.info.primary.image = "/uploads/pages/spor/x.jpg"; },
    (m) => { m.info.primary.image = "/uploads/pages/beachpools/../x.jpg"; },
    (m) => { m.info.primary.width = 0; },
    (m) => { m.info.primary.translations.tr.alt = "x".repeat(301); },
  ]) { const m = structuredClone(media); edit(m); assert.equal(isValidAzuraBeachPage(bundle, m), false); }
});

test("Beach ortak medya formu 17 kayıt ve yalnızca 11 alt açıklama tanımlar", () => {
  assert.equal(AZURA_BEACH_IMAGES.length, 17);
  assert.equal(AZURA_BEACH_IMAGES.filter((f) => f.localizedAlt !== false).length, 11);
  for (const field of AZURA_BEACH_IMAGES) {
    const record = field.path.reduce((v, key) => v[key], media);
    assert.ok(record.image);
    assert.equal(Boolean(record.translations), field.localizedAlt !== false);
  }
});

test("Beach GET/PUT doğru hedef, servis yetkisi ve revision kullanır", async () => {
  const payload = { bundle, media, revision };
  const options = { env, pageKey: "beachpools", revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/beachpools/page-content");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    if (init.method === "PUT") {
      assert.equal(init.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(init.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  } };
  assert.deepEqual(await requestAzuraSpaPage("GET", undefined, undefined, options), payload);
  assert.deepEqual(await requestAzuraSpaPage("PUT", bundle, media, options), payload);
  await assert.rejects(requestAzuraSpaPage("PUT", bundle, media, { ...options, revision: undefined }), (e) => e.status === 400);
});

test("Beach eski sürümü ve bozuk yanıtı başarı kabul etmez", async () => {
  await assert.rejects(requestAzuraSpaPage("PUT", bundle, media, { env, pageKey: "beachpools", revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm" }) }) }), (e) => e.status === 409);
  await assert.rejects(requestAzuraSpaPage("GET", undefined, undefined, { env, pageKey: "beachpools",
    fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media, revision: "bad" }) }) }), /beklenen içerik/);
});

test("Beach medya listesi ve yükleme yolu başka sayfalardan ayrıdır", async () => {
  const asset = { image: "/uploads/pages/beachpools/new.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "beachpools"), true);
  assert.equal(isValidAzuraImage(asset, false, "spor"), false);
  const fetchImpl = async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/beachpools/images");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => init.method === "GET" ? {
      images: [{ ...asset, modifiedAt: "2026-09-23T00:00:00Z" }],
    } : asset };
  };
  const options = { env, scope: "beachpools", fetchImpl };
  assert.equal((await requestAzuraImages("GET", undefined, options))[0].previewUrl, "http://localhost:3001" + asset.image);
  assert.equal((await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), options)).image, asset.image);
});
