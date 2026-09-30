import assert from "node:assert/strict";
import test from "node:test";
import { CERTIFICATE_IDS, isValidAzuraCertificatesPage } from "./azura-certificates-page-content.mjs";
import { requestAzuraPageContent } from "./azura-page-content.mjs";
import { requestAzuraImages, isValidAzuraImage } from "./azura-experience-images.mjs";
const locales = ["tr", "en", "de", "ru"];
const bundle = Object.fromEntries(locales.map((locale) => [locale, {
  hero: { eyebrow: "", title: " Certificates " },
  feature: { eyebrow: "Certificate", title: "Title", text: "" },
  gallery: { title: "Gallery", modalAlt: "Certificate" },
}]));
const image = (alt = true) => ({ image: "/uploads/pages/certificates/test.jpg", width: 800, height: 600,
  ...(alt ? { translations: Object.fromEntries(locales.map((locale) => [locale, { alt: "Certificate" }])) } : {}) });
const media = { hero: image(false), feature: image(), gallery: { images: CERTIFICATE_IDS.map((id, order) => {
  const { image: src, ...rest } = image(); return { id, order, src, ...rest };
}) } };
const revision = "a".repeat(64);
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-token" };

test("Certificates four-language fields allow only the two documented empty values", () => {
  assert.equal(isValidAzuraCertificatesPage(bundle, media), true);
  for (const edit of [
    (b) => { delete b.ru; }, (b) => { b.tr.hero.title = ""; },
    (b) => { b.tr.feature.eyebrow = ""; }, (b) => { b.tr.gallery.modalAlt = ""; },
    (b) => { b.tr.hero.eyebrow = " "; }, (b) => { b.tr.feature.text = "\n"; },
    (b) => { b.tr.feature.text = "x".repeat(4001); }, (b) => { b.tr.extra = {}; },
  ]) { const b = structuredClone(bundle); edit(b); assert.equal(isValidAzuraCertificatesPage(b, media), false); }
});
test("Certificates eight media fields preserve scoped paths, dimensions and six ordered src records", () => {
  for (const edit of [
    (m) => { m.hero.translations = image().translations; }, (m) => { delete m.feature.translations; },
    (m) => { m.gallery.images.pop(); }, (m) => { m.gallery.images[0].id = "other"; },
    (m) => { m.gallery.images[0].order = 1; },
    (m) => { m.gallery.images[0].image = m.gallery.images[0].src; delete m.gallery.images[0].src; },
    (m) => { m.feature.image = "/uploads/pages/bars/test.jpg"; },
    (m) => { m.feature.image = "/uploads/pages/certificates/../test.jpg"; },
    (m) => { m.feature.width = 0; }, (m) => { m.feature.height = 200000; },
    (m) => { m.feature.translations.tr.alt = "x".repeat(301); },
  ]) { const m = structuredClone(media); edit(m); assert.equal(isValidAzuraCertificatesPage(bundle, m), false); }
});
test("Certificates proxy forwards exact contract and quoted revision, and retains 409", async () => {
  const payload = { bundle, media, revision };
  const options = { env, pageKey: "certificates", revision, fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/certificates/page-content");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    if (init.method === "PUT") {
      assert.equal(init.headers["If-Match"], '"' + revision + '"');
      assert.deepEqual(JSON.parse(init.body), { bundle, media });
    }
    return { ok: true, json: async () => payload };
  } };
  assert.deepEqual(await requestAzuraPageContent("GET", undefined, undefined, options), payload);
  assert.deepEqual(await requestAzuraPageContent("PUT", bundle, media, options), payload);
  await assert.rejects(requestAzuraPageContent("PUT", bundle, media, { ...options, revision: undefined }), (e) => e.status === 400);
  await assert.rejects(requestAzuraPageContent("PUT", bundle, media, { ...options,
    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ error: "Conflict" }) }) }), (e) => e.status === 409);
});
test("Certificates media list/upload are isolated to certificates", async () => {
  const asset = { image: "/uploads/pages/certificates/new.jpg", mimeType: "image/jpeg", size: 123, width: 800, height: 600 };
  assert.equal(isValidAzuraImage(asset, false, "certificates"), true);
  assert.equal(isValidAzuraImage(asset, false, "bars"), false);
  const options = { env, scope: "certificates", fetchImpl: async (url, init) => {
    assert.equal(url, "http://localhost:3001/api/azura/certificates/images");
    assert.equal(init.headers.Authorization, "Bearer test-token");
    return { ok: true, json: async () => init.method === "GET"
      ? { images: [{ ...asset, modifiedAt: "2026-09-30T00:00:00Z" }] } : asset };
  } };
  assert.equal((await requestAzuraImages("GET", undefined, options))[0].previewUrl, "http://localhost:3001" + asset.image);
  assert.equal((await requestAzuraImages("POST", new File(["image"], "new.jpg", { type: "image/jpeg" }), options)).image, asset.image);
});
