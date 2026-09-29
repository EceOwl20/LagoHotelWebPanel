import assert from "node:assert/strict";
import test from "node:test";
import { createPageDraftFromPreset } from "../pages/page-presets.mjs";
import { requestAzuraPages, validateAzuraPageRequest } from "./azura-pages.mjs";
import { getAzuraImagesConnection, isValidAzuraImage } from "./azura-experience-images.mjs";

const id = "12345678-1234-1234-1234-123456789abc", revision = "a".repeat(64);
const env = { AZURA_EXPERIENCE_API_URL: "http://localhost:3001/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "test-service-token" };
function fixture() {
  const document = createPageDraftFromPreset("editorial");
  Object.assign(document, { id, status: "draft", createdAt: "2026-09-29T00:00:00.000Z", updatedAt: "2026-09-29T00:00:00.000Z" });
  document.slugs = { tr: "ornek", en: "example", de: "beispiel", ru: "пример" };
  const draft = Object.fromEntries(["schemaVersion", "template", "slugs", "showContactSection", "hero", "navigation", "seo", "sections"].map(key => [key, document[key]]));
  return { draft, record: { storageVersion: 2, id, createdAt: document.createdAt, updatedAt: document.updatedAt, publishedAt: null, history: [], draft: document, published: null } };
}
test("Azura pages proxy preserves draft and revision contracts without leaking token", async () => {
  const { record, draft } = fixture();
  const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return Response.json({ record, revision }); };
  const result = await requestAzuraPages("POST", { draft }, { env, fetchImpl });
  assert.equal(result.page.id, id);
  assert.equal(result.revision, revision);
  assert.equal(result.mediaOrigin, "http://localhost:3001");
  assert.equal(JSON.stringify(result).includes(env.AZURA_SERVICE_TOKEN), false);
  assert.equal(calls[0].url, "http://localhost:3001/api/azura/pages");
  assert.equal(calls[0].options.redirect, "error");
  await requestAzuraPages("PUT", { action: "save", draft }, { id, revision, env, fetchImpl });
  assert.equal(calls[1].options.headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(calls[1].options.body), { action: "save", draft });
});
test("history, restore and delete use exact endpoint and bodyless contracts", async () => {
  const { record } = fixture(); const calls = [];
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return Response.json({ record, revision, ...(options.method === "DELETE" ? { deleted: true } : {}) }); };
  await requestAzuraPages("GET", undefined, { id, history: true, env, fetchImpl });
  assert.equal(calls[0].url.endsWith(`/${id}/history`), true);
  await requestAzuraPages("POST", undefined, { id, versionId: id, revision, env, fetchImpl });
  assert.equal(calls[1].url.endsWith(`/${id}/history/${id}/restore`), true);
  assert.equal(calls[1].options.body, undefined);
  const removed = await requestAzuraPages("DELETE", undefined, { id, revision, env, fetchImpl });
  assert.equal(removed.deleted, true);
});
test("unsafe requests and privileged record fields never reach upstream", async () => {
  const { draft } = fixture();
  for (const [method, body, options] of [
    ["GET", undefined, { id: "../pages" }],
    ["POST", { draft: { ...draft, status: "published" } }, {}],
    ["PUT", { action: "save", draft, published: draft }, { id, revision }],
    ["PUT", { action: "publish" }, { id }],
    ["DELETE", {}, { id, revision }],
    ["POST", {}, { id, versionId: id, revision }],
  ]) assert.throws(() => validateAzuraPageRequest(method, body, options), { status: 400 });
  await assert.rejects(requestAzuraPages("GET", undefined, { env, fetchImpl: async () => Response.json({ pages: [{ record: {}, revision }] }) }), { status: 502 });
});
test("conflict and upstream failure are not reported as successful writes", async () => {
  await assert.rejects(requestAzuraPages("PUT", { action: "publish" }, { id, revision, env,
    fetchImpl: async () => Response.json({ error: "Sürüm değişti." }, { status: 409 }) }), { status: 409 });
  await assert.rejects(requestAzuraPages("GET", undefined, { env, fetchImpl: async () => { throw new Error("secret"); } }), { status: 502 });
});
test("dynamic page media is isolated from other Azura libraries", () => {
  assert.equal(getAzuraImagesConnection(env, "dynamic-pages").url, "http://localhost:3001/api/azura/pages/images");
  const image = { image: "/uploads/dynamic-pages/example.webp", mimeType: "image/webp", size: 100, width: 10, height: 10 };
  assert.equal(isValidAzuraImage(image, false, "dynamic-pages"), true);
  assert.equal(isValidAzuraImage({ ...image, image: "/uploads/blog/example.webp" }, false, "dynamic-pages"), false);
});
