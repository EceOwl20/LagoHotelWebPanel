import assert from "node:assert/strict";
import test from "node:test";
import { AZURA_GALLERY_CATEGORIES, GALLERY_LOCALES, isAzuraGallery, isGalleryOperation, isGalleryTranslations } from "./azura-gallery-model.mjs";
import { requestAzuraGallery } from "./azura-gallery.mjs";
import { requestAzuraImages } from "./azura-experience-images.mjs";

export const translations = Object.fromEntries(GALLERY_LOCALES.map((l) => [l, { alt: " Açıklama " }]));
export const record = (id = "gallery-one", order = 0) => ({
  id, order, src: "/uploads/gallery/sample.jpg", width: 800, height: 600, translations: structuredClone(translations),
});
export const fixture = () => ({
  schemaVersion: 1, customMetadata: { preserved: true },
  categories: AZURA_GALLERY_CATEGORIES.map((id) => ({ id, images: id === "general" ? [record(), record("gallery-two", 1)] : [] })),
});
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "secret-test" };
const revision = "a".repeat(64);

test("Gallery supports variable lengths, empty meeting, shared sources and root metadata", () => {
  const gallery = fixture();
  gallery.categories[1].images.push(record("gallery-room"));
  assert.equal(isAzuraGallery(gallery), true);
  assert.equal(isAzuraGallery({ ...gallery, categories: gallery.categories.map((c) => ({ ...c, images: [] })) }), true);
  assert.equal(isGalleryTranslations(translations), true);
  for (const value of ["", " ", "a\nb", "x".repeat(301)]) {
    assert.equal(isGalleryTranslations({ ...translations, tr: { alt: value } }), false);
  }
});

test("Gallery rejects incorrect identities, order, dimensions, locales and foreign paths", () => {
  for (const edit of [
    (g) => { g.categories.reverse(); }, (g) => { g.categories[0].images[1].id = "gallery-one"; },
    (g) => { g.categories[0].images[0].order = 1; },
    (g) => { g.categories[0].images[0].src = "/uploads/pages/gallery/a.jpg"; },
    (g) => { g.categories[0].images[0].src = "/uploads/gallery/../a.jpg"; },
    (g) => { g.categories[0].images[0].width = 0; },
    (g) => { delete g.categories[0].images[0].translations.ru; },
  ]) { const g = fixture(); edit(g); assert.equal(isAzuraGallery(g), false); }
});

test("Gallery operations accept only the four exact contracts", () => {
  assert.equal(isGalleryOperation({ action: "add", categoryId: "meeting", src: record().src, translations }), true);
  assert.equal(isGalleryOperation({ action: "reorder", categoryId: "meeting", imageIds: [] }), true);
  assert.equal(isGalleryOperation({ action: "update", categoryId: "general", imageId: "gallery-one", translations }), true);
  assert.equal(isGalleryOperation({ action: "remove", categoryId: "general", imageId: "gallery-one" }), true);
  for (const action of [
    { action: "remove", categoryId: "general", imageId: "gallery-one", deleteFile: true },
    { action: "remove", categoryId: "lobby", imageId: "gallery-one" },
    { action: "reorder", categoryId: "general", imageIds: ["gallery-one", "gallery-one"] },
    { action: "toString", categoryId: "general" },
  ]) assert.equal(isGalleryOperation(action), false);
});

test("Gallery proxy sends PATCH and quoted If-Match without exposing the token", async () => {
  const operation = { action: "remove", categoryId: "general", imageId: "gallery-one" };
  const options = { env, revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/gallery");
    assert.equal(init.headers.Authorization, "Bearer secret-test");
    if (init.method === "PATCH") {
      assert.equal(init.headers["If-Match"], '"' + revision + '"');
      assert.deepEqual(JSON.parse(init.body), operation);
    }
    return { ok: true, json: async () => ({ gallery: fixture(), revision }) };
  } };
  const result = await requestAzuraGallery("PATCH", operation, options);
  assert.equal(result.mediaOrigin, "http://localhost:3001");
  assert.equal(JSON.stringify(result).includes("secret-test"), false);
  assert.deepEqual((await requestAzuraGallery("GET", undefined, options)).gallery, fixture());
  await assert.rejects(requestAzuraGallery("DELETE", operation, options), (e) => e.status === 400);
  await assert.rejects(requestAzuraGallery("PATCH", operation, { ...options, revision: undefined }), (e) => e.status === 400);
  await assert.rejects(requestAzuraGallery("PATCH", operation, { ...options, fetchImpl: async () =>
    ({ ok: false, status: 409, json: async () => ({ error: "Conflict" }) }) }), (e) => e.status === 409);
  await assert.rejects(requestAzuraGallery("GET", undefined, { ...options, fetchImpl: async () =>
    ({ ok: true, json: async () => ({ gallery: {}, revision }) }) }), (e) => e.status === 502);
});

test("Gallery media uses its separate collection directory and upload/list endpoints", async () => {
  const asset = { image: record().src, mimeType: "image/jpeg", size: 100, width: 800, height: 600 };
  const options = { env, scope: "gallery", fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/gallery/images");
    return { ok: true, json: async () => init.method === "GET" ?
      { images: [{ ...asset, modifiedAt: "2026-09-28T00:00:00Z" }] } : asset };
  } };
  assert.equal((await requestAzuraImages("GET", undefined, options))[0].previewUrl, "http://localhost:3001" + asset.image);
  assert.equal((await requestAzuraImages("POST", new File(["test"], "sample.jpg", { type: "image/jpeg" }), options)).image, asset.image);
  await assert.rejects(requestAzuraImages("GET", undefined, { ...options, fetchImpl: async () =>
    ({ ok: true, json: async () => ({ images: [{ ...asset, image: "/uploads/pages/bars/test.jpg", modifiedAt: "2026-09-28" }] }) }) }));
});
