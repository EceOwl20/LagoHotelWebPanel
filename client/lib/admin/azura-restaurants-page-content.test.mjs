import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AZURA_RESTAURANT_CAROUSELS, getAzuraRestaurantsPageConnection,
  isValidAzuraRestaurantsPage, requestAzuraRestaurantsPage,
} from "./azura-restaurants-page-content.mjs";
import {
  AZURA_RESTAURANT_MEDIA_FIELDS, LAGO_RESTAURANT_MEDIA_FIELDS, restaurantMediaAtPath,
} from "./restaurant-page-fields.mjs";
const lagoMedia = JSON.parse(readFileSync(new URL("../../content/site-pages/restaurants.json", import.meta.url), "utf8"));

const locales = ["tr", "en", "de", "ru"];
const revision = "a".repeat(64);
const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const cardTexts = (keys) => Object.fromEntries(keys.map((key) =>
  [key, { title: key, subtitle: "Mutfak", text: "Açıklama" }]));
const carousel = (keys) => ({
  subtitle: "Üst başlık", title: "Başlık", text: "Metin", cards: cardTexts(keys),
});
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  hero: { subtitle: "Üst başlık", title: "Başlık", text: "Metin" },
  intro: { subtitle: "", title: "Başlık", text: "Metin", span: "Liste", list1: "Madde" },
  mainRestaurant: {
    subtitle: "Üst başlık", title: "Başlık", text: "Metin", span: "Saatler",
    list1: "Bir", list2: "İki", list3: "Üç",
  },
  alacarteCarousel: carousel(AZURA_RESTAURANT_CAROUSELS.alacarteCarousel),
  reverse: { span: "", title: "Başlık", text: "Metin", text2: "İkinci metin" },
  dessertsCarousel: carousel(AZURA_RESTAURANT_CAROUSELS.dessertsCarousel),
  discover: { subtitle: "Üst başlık", title: "Başlık", text: "Metin" },
}]));
const image = (name) => ({
  image: `/uploads/pages/restaurants/${name}.jpg`,
  width: 800, height: 600,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: `${name} ${locale}` }])),
});
const media = {
  hero: image("hero"),
  intro: { primary: image("intro-primary"), secondary: image("intro-secondary") },
  mainRestaurant: image("main"),
  alacarteCarousel: { cards: Object.fromEntries(AZURA_RESTAURANT_CAROUSELS.alacarteCarousel.map((key) => [key, image(key)])) },
  reverse: { primary: image("reverse-primary"), secondary: image("reverse-secondary") },
  dessertsCarousel: { cards: Object.fromEntries(AZURA_RESTAURANT_CAROUSELS.dessertsCarousel.map((key) => [key, image(key)])) },
  discover: image("discover"),
};

test("restoran adresi doğrulanmış Azura bağlantısından türetilir", () => {
  assert.equal(getAzuraRestaurantsPageConnection(env).url, "http://localhost:3001/api/azura/restaurants/page-content");
  assert.throws(() => getAzuraRestaurantsPageConnection({
    ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }));
});

test("dört dil, yedi bölüm ve 13 görselin kesin şeması doğrulanır", () => {
  assert.equal(isValidAzuraRestaurantsPage(bundle, media), true);
  assert.equal(isValidAzuraRestaurantsPage({ ...bundle, tr: { ...bundle.tr, extra: {} } }, media), false);
  assert.equal(isValidAzuraRestaurantsPage({ ...bundle, tr: { ...bundle.tr, intro: { ...bundle.tr.intro, text: "" } } }, media), false);
  assert.equal(isValidAzuraRestaurantsPage(bundle, {
    ...media, alacarteCarousel: { cards: { orchestra: media.alacarteCarousel.cards.orchestra } },
  }), false);
  assert.equal(isValidAzuraRestaurantsPage(bundle, {
    ...media, hero: { ...media.hero, width: 0 },
  }), false);
  assert.equal(isValidAzuraRestaurantsPage(bundle, {
    ...media, hero: { ...media.hero, image: "/uploads/pages/rooms/other.jpg" },
  }), false);
});

test("ortak restoran formu Lago ve Azura medya alanlarını eksiksiz eşler", () => {
  assert.equal(LAGO_RESTAURANT_MEDIA_FIELDS.length, 15);
  assert.equal(AZURA_RESTAURANT_MEDIA_FIELDS.length, 13);
  assert.ok(LAGO_RESTAURANT_MEDIA_FIELDS.every(({ path }) => restaurantMediaAtPath(lagoMedia, path)?.image));
  assert.ok(AZURA_RESTAURANT_MEDIA_FIELDS.every(({ path }) => restaurantMediaAtPath(media, path)?.image));
});

test("GET ve PUT yalnızca servis tokenı ve If-Match ile Azura'ya iletilir", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/restaurants/page-content");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), { bundle, media });
    }
    return { ok: true, json: async () => ({ bundle, media, revision }) };
  };
  assert.deepEqual(await requestAzuraRestaurantsPage("GET", undefined, undefined, { env, fetchImpl }),
    { bundle, media, revision });
  assert.deepEqual(await requestAzuraRestaurantsPage("PUT", bundle, media, { env, fetchImpl, revision }),
    { bundle, media, revision });
});

test("bozuk yanıt ve 409 çakışması başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraRestaurantsPage("GET", undefined, undefined, {
    env, fetchImpl: async () => ({ ok: true, json: async () => ({
      bundle, media: { hero: media.hero }, revision,
    }) }),
  }), /beklenen içerik/);
  await assert.rejects(requestAzuraRestaurantsPage("PUT", bundle, media, {
    env, revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm." }) }),
  }), /Eski sürüm/);
});
