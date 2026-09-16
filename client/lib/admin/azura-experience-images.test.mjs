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
  assert.throws(() => getAzuraImagesConnection({
    ...env, AZURA_EXPERIENCE_API_URL: "http://evil.test/api/azura/homepage/experience",
  }));
});

test("Azura görsel yanıtı ve güvenli önizleme yolu doğrulanır", () => {
  assert.equal(isValidAzuraImage(image), true);
  assert.equal(isValidAzuraImage({ ...image, modifiedAt: "2026-09-15T12:00:00.000Z" }, true), true);
  assert.equal(isValidAzuraImage({ ...image, image: "/uploads/pages/homepage/../bad.jpg" }), false);
  assert.equal(isValidAzuraImage({ ...image, size: 9 * 1024 * 1024 }), false);
  assert.equal(isValidAzuraImage({ ...image, previewUrl: "https://evil.test" }), false);
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
