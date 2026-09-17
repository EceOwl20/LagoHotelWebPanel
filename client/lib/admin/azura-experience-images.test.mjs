import assert from "node:assert/strict";
import test from "node:test";
import {
  getAzuraImagesConnection,
  isValidAzuraImage,
  requestAzuraImages,
} from "./azura-experience-images.mjs";

const env = {
  AZURA_EXPERIENCE_API_URL: "http://localhost:3000/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-secret",
};
const image = {
  image: "/uploads/pages/homepage/experience-background.jpg",
  mimeType: "image/jpeg",
  size: 1234,
  width: 300,
  height: 450,
};

test("görsel endpoint'i doğrulanan Azura adresinden türetilir", () => {
  assert.equal(getAzuraImagesConnection(env).url,
    "http://localhost:3000/api/azura/homepage/experience/images");
  assert.equal(getAzuraImagesConnection(env, "homepage").url,
    "http://localhost:3000/api/azura/homepage/images");
  assert.equal(getAzuraImagesConnection(env, "rooms").url,
    "http://localhost:3000/api/azura/rooms/images");
  assert.throws(() => getAzuraImagesConnection(env, "unknown"));
  assert.throws(() => getAzuraImagesConnection({
    ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }));
});

test("genel anasayfa medya isteği deneyim adresini kullanmaz", async () => {
  const listed = { ...image, modifiedAt: "2026-09-15T12:00:00.000Z" };
  await requestAzuraImages("GET", undefined, {
    env,
    scope: "homepage",
    fetchImpl: async (url, options) => {
      assert.equal(url, "http://localhost:3000/api/azura/homepage/images");
      assert.equal(options.headers.Authorization, "Bearer test-secret");
      return { ok: true, json: async () => ({ images: [listed] }) };
    },
  });
});

test("Azura görsel yanıtı ve güvenli önizleme yolu doğrulanır", () => {
  assert.equal(isValidAzuraImage(image), true);
  assert.equal(isValidAzuraImage({ ...image, modifiedAt: "2026-09-15T12:00:00.000Z" }, true), true);
  assert.equal(isValidAzuraImage({ ...image, image: "/uploads/pages/homepage/../bad.jpg" }), false);
  assert.equal(isValidAzuraImage({ ...image, size: 9 * 1024 * 1024 }), false);
  assert.equal(isValidAzuraImage({ ...image, previewUrl: "https://evil.test" }), false);
  const roomImage = { ...image, image: "/uploads/pages/rooms/deluxe-primary.png" };
  assert.equal(isValidAzuraImage(roomImage, false, "rooms"), true);
  assert.equal(isValidAzuraImage(image, false, "rooms"), false);
});

test("oda görsel listesi ve yüklemesi doğru Azura endpoint'ine gider", async () => {
  const roomImage = { ...image, image: "/uploads/pages/rooms/deluxe-primary.png" };
  const listed = { ...roomImage, modifiedAt: "2026-09-15T12:00:00.000Z" };
  const images = await requestAzuraImages("GET", undefined, {
    env, scope: "rooms",
    fetchImpl: async (url, options) => {
      assert.equal(url, "http://localhost:3000/api/azura/rooms/images");
      assert.equal(options.headers.Authorization, "Bearer test-secret");
      return { ok: true, json: async () => ({ images: [listed] }) };
    },
  });
  assert.equal(images[0].previewUrl, `http://localhost:3000${roomImage.image}`);
  await requestAzuraImages("POST", new File(["image"], "room.png", { type: "image/png" }), {
    env, scope: "rooms",
    fetchImpl: async (url) => {
      assert.equal(url, "http://localhost:3000/api/azura/rooms/images");
      return { ok: true, json: async () => roomImage };
    },
  });
});

test("liste ve yükleme yalnızca Azura Bearer tokenıyla yapılır", async () => {
  const listed = { ...image, modifiedAt: "2026-09-15T12:00:00.000Z" };
  const images = await requestAzuraImages("GET", undefined, {
    env,
    fetchImpl: async (url, options) => {
      assert.equal(url, getAzuraImagesConnection(env).url);
      assert.equal(options.headers.Authorization, "Bearer test-secret");
      return { ok: true, json: async () => ({ images: [listed] }) };
    },
  });
  assert.deepEqual(images, [{ ...listed, previewUrl: `http://localhost:3000${image.image}` }]);

  const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
  const uploaded = await requestAzuraImages("POST", file, {
    env,
    fetchImpl: async (_url, options) => {
      assert.equal(options.headers.Authorization, "Bearer test-secret");
      assert.equal(options.body.get("file").name, "photo.jpg");
      return { ok: true, json: async () => image };
    },
  });
  assert.equal(uploaded.previewUrl, `http://localhost:3000${image.image}`);
});

test("bozuk liste veya Azura hatası başarı sayılmaz", async () => {
  await assert.rejects(requestAzuraImages("GET", undefined, {
    env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ images: [{ ...image, previewUrl: "https://evil.test" }] }) }),
  }), /beklenen biçimde değil/);
  await assert.rejects(requestAzuraImages("POST", new File(["x"], "x.jpg", { type: "image/jpeg" }), {
    env,
    fetchImpl: async () => ({ ok: false, status: 415, json: async () => ({ error: "Görsel bozuk." }) }),
  }), /Görsel bozuk/);
});
