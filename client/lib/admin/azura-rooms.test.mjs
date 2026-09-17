import assert from "node:assert/strict";
import test from "node:test";
import {
  getAzuraRoomsConnection,
  isValidAzuraRoomsCards,
  requestAzuraRoomsCards,
} from "./azura-rooms.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const revision = "a".repeat(64);
const locales = ["tr", "en", "de", "ru"];
const image = (name) => ({
  src: `/uploads/pages/rooms/${name}.png`,
  width: 860,
  height: 1240,
  translations: Object.fromEntries(locales.map((locale) => [locale, { alt: `${name} ${locale}` }])),
});
const cards = ["deluxe", "family", "fantasy"].map((key) => ({
  key,
  primary: image(`${key}-primary`),
  secondary: image(`${key}-secondary`),
  translations: Object.fromEntries(locales.map((locale) => [locale, {
    title: `${key} ${locale}`, text: "Açıklama", area: "30 m²", view: "Deniz", buttonText: "Keşfet",
  }])),
}));

test("oda kartı endpoint'i doğrulanmış Azura adresinden türetilir", () => {
  assert.equal(getAzuraRoomsConnection(env).url, "http://localhost:3001/api/azura/rooms/cards");
  assert.throws(() => getAzuraRoomsConnection({ ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience" }));
});

test("Azura'nın üç kart şeması, görsel ölçüleri ve dört dil doğrulanır", () => {
  assert.equal(isValidAzuraRoomsCards(cards), true);
  assert.equal(isValidAzuraRoomsCards(cards.slice(0, 2)), false);
  assert.equal(isValidAzuraRoomsCards([cards[1], cards[0], cards[2]]), false);
  assert.equal(isValidAzuraRoomsCards(cards.map((card, index) => index ? card : { ...card, primary: { ...card.primary, width: 0 } })), false);
  assert.equal(isValidAzuraRoomsCards(cards.map((card, index) => index ? card : { ...card, secondary: { ...card.secondary, src: "/uploads/pages/homepage/bad.png" } })), false);
  assert.equal(isValidAzuraRoomsCards(cards.map((card, index) => index ? card : { ...card, translations: { ...card.translations, tr: { ...card.translations.tr, text: "satır\nsonu" } } })), false);
});

test("GET ve PUT yalnızca servis tokenı ve If-Match ile Azura'ya iletilir", async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, "http://localhost:3001/api/azura/rooms/cards");
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    if (options.method === "PUT") {
      assert.equal(options.headers["If-Match"], `"${revision}"`);
      assert.deepEqual(JSON.parse(options.body), { cards });
    }
    return { ok: true, json: async () => ({ cards, revision }) };
  };
  assert.deepEqual(await requestAzuraRoomsCards("GET", undefined, { env, fetchImpl }), { cards, revision });
  assert.deepEqual(await requestAzuraRoomsCards("PUT", cards, { env, fetchImpl, revision }), { cards, revision });
});

test("bozuk yanıt ve 409 çakışması başarı olarak gösterilmez", async () => {
  await assert.rejects(requestAzuraRoomsCards("GET", undefined, {
    env, fetchImpl: async () => ({ ok: true, json: async () => ({ cards: cards.slice(0, 2), revision }) }),
  }), /beklenen içerik/);
  await assert.rejects(requestAzuraRoomsCards("PUT", cards, {
    env, revision,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Eski sürüm." }) }),
  }), /Eski sürüm/);
});
