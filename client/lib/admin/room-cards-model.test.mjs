import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  AZURA_ROOM_CARDS,
  LAGO_ROOM_CARDS,
  lagoRoomsToCards,
  cardsToLagoRooms,
  azuraRoomsToCards,
} from "./room-cards-model.mjs";

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function readLagoFixtures() {
  const media = JSON.parse(await readFile(path.join(clientRoot, "content/site-pages/rooms.json"), "utf8"));
  const bundle = {};
  for (const locale of ["tr", "en", "de", "ru"]) {
    bundle[locale] = JSON.parse(await readFile(path.join(clientRoot, `messages/${locale}.json`), "utf8")).Accommodation;
  }
  return { bundle, media };
}

test("Lago'nun canlı oda listesi altı kart ve doğru mesaj bölümleriyle eşleşir", async () => {
  const { bundle, media } = await readLagoFixtures();
  const cards = lagoRoomsToCards(bundle, media);
  assert.deepEqual(cards.map((card) => card.key), LAGO_ROOM_CARDS.map((card) => card.key));
  assert.equal(cards.length, 6);
  assert.equal(cards[0].translations.tr.title, bundle.tr.RoomSection1.title);
  assert.equal(cards[5].translations.ru.text, bundle.ru.RoomSection7.subtitle);
  assert.equal(cards[5].secondary.src, media.cards.disabled.secondary.image);
});

test("Lago kartlarının gidiş-dönüş dönüşümü diğer sayfa alanlarını değiştirmez", async () => {
  const { bundle, media } = await readLagoFixtures();
  const originalBundle = structuredClone(bundle);
  const originalMedia = structuredClone(media);
  const result = cardsToLagoRooms(lagoRoomsToCards(bundle, media), bundle, media);
  assert.deepEqual(result.bundle, originalBundle);
  assert.deepEqual(result.media, originalMedia);
  assert.deepEqual(bundle, originalBundle);
  assert.deepEqual(media, originalMedia);
  assert.equal(result.bundle.tr.RoomSection6.title, originalBundle.tr.RoomSection6.title);
  assert.deepEqual(result.media.hero, originalMedia.hero);
  assert.deepEqual(result.media.parallax, originalMedia.parallax);
});

test("Azura üç kart olarak kalır; eksik veya yanlış sıralı veri reddedilir", () => {
  const cards = AZURA_ROOM_CARDS.map(({ key }) => ({ key }));
  assert.deepEqual(azuraRoomsToCards(cards), cards);
  assert.throws(() => azuraRoomsToCards(cards.slice(0, 2)), /sayısı veya sırası/);
  assert.throws(() => azuraRoomsToCards([cards[1], cards[0], cards[2]]), /sayısı veya sırası/);
});
