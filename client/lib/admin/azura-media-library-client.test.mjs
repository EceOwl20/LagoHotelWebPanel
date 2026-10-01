import assert from "node:assert/strict";
import test from "node:test";
import { loadAzuraLibrary, mediaTargetScope, reuseAzuraImage } from "./azura-media-library-client.mjs";
import { readMediaReuseRequest } from "./azura-media-library-request.mjs";

test("media scopes map page folders without allowing source-only or unknown targets", () => {
  for (const scope of ["homepage", "rooms", "restaurants", "about", "spawellness", "spor", "beachpools", "kidsclub", "bars", "entertainment", "certificates", "deluxeroom", "familyroom", "fantasyroom"]) {
    assert.equal(mediaTargetScope(`pages/${scope}`), scope);
  }
  assert.equal(mediaTargetScope("pages/room-options"), null);
  assert.equal(mediaTargetScope("pages"), null);
});
test("library collects all pages with remote previews and rejects repeated cursors", async () => {
  const calls = [];
  const result = await loadAzuraLibrary({ fetchImpl: async url => {
    calls.push(url);
    return Response.json({ images: [{ image: `/uploads/blog/${calls.length}.jpg` }], mediaOrigin: "https://azura.test", nextOffset: calls.length === 1 ? 100 : null });
  } });
  assert.equal(calls.length, 2);
  assert.match(calls[1], /offset=100$/);
  assert.equal(result.images[1].previewUrl, "https://azura.test/uploads/blog/2.jpg");
  await assert.rejects(loadAzuraLibrary({ fetchImpl: async () => Response.json({ images: [], nextOffset: 0 }) }), /sayfalama/);
});
test("reuse sends only source and target, returns real dimensions, propagates failure", async () => {
  let request;
  const asset = { image: "/uploads/pages/about/copy.jpg", width: 1200, height: 800 };
  assert.deepEqual(await reuseAzuraImage("/uploads/blog/source.jpg", "about", { fetchImpl: async (url, init) => {
    request = { url, ...init }; return Response.json(asset, { status: 201 });
  } }), asset);
  assert.deepEqual(JSON.parse(request.body), { image: "/uploads/blog/source.jpg", targetScope: "about" });
  assert.equal(request.url, "/api/admin/azura/media-library/reuse");
  await assert.rejects(reuseAzuraImage("x", "about", { fetchImpl: async () => Response.json({ error: "Denied" }, { status: 403 }) }), /Denied/);
  await assert.rejects(reuseAzuraImage("x", "about", { fetchImpl: async () => Response.json({ ...asset, image: "/uploads/blog/wrong.jpg" }) }), /hedef/);
});
test("reuse JSON reader enforces content type, malformed JSON and streaming size", async () => {
  const request = (body, type = "application/json") => new Request("http://local/reuse", { method: "POST", headers: { "Content-Type": type }, body });
  assert.deepEqual(await readMediaReuseRequest(request('{"image":"x","targetScope":"blog"}')), { image: "x", targetScope: "blog" });
  await assert.rejects(readMediaReuseRequest(request("{}", "text/plain")), { status: 415 });
  await assert.rejects(readMediaReuseRequest(request("{")), { status: 400 });
  await assert.rejects(readMediaReuseRequest(request(" ".repeat(4097))), { status: 413 });
});
