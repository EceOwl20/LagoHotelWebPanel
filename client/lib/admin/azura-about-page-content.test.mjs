import assert from "node:assert/strict";
import test from "node:test";
import { getAzuraAboutPageConnection, isValidAzuraAboutPage, requestAzuraAboutPage } from "./azura-about-page-content.mjs";
import { getAzuraImagesConnection, isValidAzuraImage, requestAzuraImages } from "./azura-experience-images.mjs";

const locales = ["tr", "en", "de", "ru"];
const revision = "a".repeat(64);
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };
const text = { subtitle: "Üst başlık", title: "Başlık", text: " Açıklama " };
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  hero: { subtitle: "Üst başlık", title: "Başlık" },
  location: { ...text, buttonText: "Keşfet" },
  missionVision: { ...text, mission: { ...text }, vision: { ...text } },
}]));
const image = (name) => ({ image: `/uploads/pages/about/${name}.jpg`, width: 800, height: 600,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: `${name} ${locale}` }])) });
const media = { hero: image("hero"), location: image("location"),
  moments: { images: Array.from({ length: 4 }, (_, index) => ({
    id: `about-moment-${index + 1}`, order: index, ...image(`moment-${index + 1}`),
  })) }, missionVision: { mission: image("mission"), vision: image("vision") } };

test("About dört dil ve sekiz görselle doğrulanır; Lago ek alanları kabul edilmez", () => {
  assert.equal(isValidAzuraAboutPage(bundle, media), true);
  assert.equal(isValidAzuraAboutPage({ ...bundle, tr: { ...bundle.tr, hero: { subtitle: "", title: "Başlık" } } }, media), false);
  assert.equal(isValidAzuraAboutPage({ tr: bundle.tr }, media), false);
  assert.equal(isValidAzuraAboutPage(bundle, { ...media, discoveryCarousel: {} }), false);
  assert.equal(isValidAzuraAboutPage(bundle, { ...media, missionVision: { ...media.missionVision, document: image("document") } }), false);
  assert.equal(isValidAzuraAboutPage(bundle, { ...media, hero: { ...media.hero, image: "/uploads/pages/rooms/test.jpg" } }), false);
  assert.equal(isValidAzuraAboutPage(bundle, { ...media, hero: { ...media.hero, width: 0 } }), false);
});

test("About galeri kimliği, sayısı ve sırası korunur", () => {
  const copy = structuredClone(media);
  copy.moments.images.reverse();
  assert.equal(isValidAzuraAboutPage(bundle, copy), false);
  copy.moments.images.reverse();
  copy.moments.images[0].id = "other";
  assert.equal(isValidAzuraAboutPage(bundle, copy), false);
  copy.moments.images.pop();
  assert.equal(isValidAzuraAboutPage(bundle, copy), false);
});

test("About adresleri mevcut doğrulanmış sunucudan türetilir", () => {
  assert.equal(getAzuraAboutPageConnection(env).url, "http://localhost:3001/api/azura/about/page-content");
  assert.equal(getAzuraImagesConnection(env, "about").url, "http://localhost:3001/api/azura/about/images");
  assert.throws(() => getAzuraAboutPageConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience" }));
});

test("About GET ve PUT doğru token ve tırnaklı revision ile iletilir", async () => {
  const payload = { bundle, media, revision };
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/about/page-content");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  };
  assert.deepEqual(await requestAzuraAboutPage("GET", undefined, undefined, { env, fetchImpl }), payload);
  assert.deepEqual(await requestAzuraAboutPage("PUT", bundle, media, { env, fetchImpl, revision }), payload);
  await assert.rejects(requestAzuraAboutPage("PUT", bundle, media, { env, fetchImpl }), /sürümü geçersiz/);
});

test("About bozuk yanıt ve çakışma başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraAboutPage("GET", undefined, undefined, {
    env, fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media, revision: "wrong" }) }),
  }), /beklenen içerik/);
  await assert.rejects(requestAzuraAboutPage("PUT", bundle, media, {
    env, revision, fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm." }) }),
  }), (error) => error.status === 409);
});

test("About görsel listesi, önizleme ve yükleme kendi kapsamını kullanır", async () => {
  const asset = { image: "/uploads/pages/about/hero.jpg", mimeType: "image/jpeg", size: 100, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "about"), true);
  assert.equal(isValidAzuraImage(asset, false, "restaurants"), false);
  assert.equal(isValidAzuraImage({ ...asset, image: "/uploads/pages/about/../hero.jpg" }, false, "about"), false);
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/about/images");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    if (options.method === "POST") assert.equal(options.body.get("file").name, "photo.jpg");
    return { ok: true, json: async () => options.method === "POST" ? asset : {
      images: [{ ...asset, modifiedAt: "2026-09-18T12:00:00.000Z" }],
    } };
  };
  const images = await requestAzuraImages("GET", undefined, { env, scope: "about", fetchImpl });
  assert.equal(images[0].previewUrl, "http://localhost:3001/uploads/pages/about/hero.jpg");
  const uploaded = await requestAzuraImages("POST", new File(["image"], "photo.jpg", { type: "image/jpeg" }), { env, scope: "about", fetchImpl });
  assert.equal(uploaded.image, asset.image);
});
