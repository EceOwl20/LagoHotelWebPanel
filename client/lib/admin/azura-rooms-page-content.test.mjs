import assert from "node:assert/strict";
import test from "node:test";
import {
  AZURA_ROOMS_INTRO_FIELDS, AZURA_ROOMS_CARD_FIELDS, AZURA_ROOMS_PARALLAX_FIELDS,
  getAzuraRoomsPageConnection, isValidAzuraRoomsPage, requestAzuraRoomsPage,
} from "./azura-rooms-page-content.mjs";

const locales = ["tr", "en", "de", "ru"];
const revision = "a".repeat(64);
const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const fields = (limits) => Object.fromEntries(Object.keys(limits).map((key) => [key, `${key} içerik`]));
const image = (name) => ({
  image: `/uploads/pages/rooms/${name}.png`,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: `${name} ${locale}` }])),
});
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  ...fields(AZURA_ROOMS_INTRO_FIELDS),
  RoomSection1: fields(AZURA_ROOMS_CARD_FIELDS),
  RoomSection2: fields(AZURA_ROOMS_CARD_FIELDS),
  RoomSection3: fields(AZURA_ROOMS_CARD_FIELDS),
  RoomsParallax: fields(AZURA_ROOMS_PARALLAX_FIELDS),
}]));
const media = {
  hero: image("rooms-hero"),
  cards: Object.fromEntries(["deluxe", "family", "fantasy"].map((key) => [key, {
    primary: image(`${key}-primary`), secondary: image(`${key}-secondary`),
  }])),
  parallax: image("rooms-parallax"),
};

test("oda sayfası endpoint'i doğrulanmış Azura adresinden türetilir", () => {
  assert.equal(getAzuraRoomsPageConnection(env).url, "http://localhost:3001/api/azura/rooms/page-content");
  assert.throws(() => getAzuraRoomsPageConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience" }));
});

test("üç oda ve dört dilin eksiksiz sayfa şeması doğrulanır", () => {
  assert.equal(isValidAzuraRoomsPage(bundle, media), true);
  assert.equal(isValidAzuraRoomsPage({ ...bundle, tr: { ...bundle.tr, RoomSection4: {} } }, media), false);
  assert.equal(isValidAzuraRoomsPage(bundle, { ...media, cards: { deluxe: media.cards.deluxe } }), false);
  assert.equal(isValidAzuraRoomsPage(bundle, { ...media, hero: { ...media.hero, image: "/uploads/pages/homepage/bad.png" } }), false);
  assert.equal(isValidAzuraRoomsPage({ ...bundle, tr: { ...bundle.tr, text: "satır\nsonu" } }, media), false);
});

test("GET ve PUT yalnızca Bearer tokenı, gövde ve If-Match ile iletilir", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/rooms/page-content");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), { bundle, media });
    }
    return { ok: true, json: async () => ({ bundle, media, revision }) };
  };
  assert.deepEqual(await requestAzuraRoomsPage("GET", undefined, undefined, { env, fetchImpl }), { bundle, media, revision });
  assert.deepEqual(await requestAzuraRoomsPage("PUT", bundle, media, { env, fetchImpl, revision }), { bundle, media, revision });
});

test("bozuk yanıt ve 409 çakışması başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraRoomsPage("GET", undefined, undefined, {
    env, fetchImpl: async () => ({ ok: true, json: async () => ({ bundle, media: { hero: media.hero }, revision }) }),
  }), /beklenen içerik/);
  await assert.rejects(requestAzuraRoomsPage("PUT", bundle, media, {
    env, revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm." }) }),
  }), /Eski sürüm/);
});
