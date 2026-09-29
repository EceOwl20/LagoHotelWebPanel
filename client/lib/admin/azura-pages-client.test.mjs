import assert from "node:assert/strict";
import test from "node:test";
import { saveAzuraPage, pageDraftInput } from "./azura-pages-client.mjs";
import { id, result, revision, nextRevision } from "../../tests/fixtures/azura-pages.mjs";
test("page create sends only editable draft fields, not server metadata", async () => {
  const draft = result().page;
  await saveAzuraPage({ draft, fetchImpl: async (url, options) => {
    assert.equal(url, "/api/admin/azura/pages"); assert.equal(options.method, "POST");
    assert.equal(options.headers["If-Match"], undefined);
    assert.deepEqual(JSON.parse(options.body), { draft: pageDraftInput(draft) });
    return Response.json(result());
  } });
  assert.equal(pageDraftInput({ ...result().page, published: {}, history: [], revision }).published, undefined);
});
test("save then publish uses returned revision, adopting each confirmed result", async () => {
  const calls = [], adopted = [];
  await saveAzuraPage({ id, revision, draft: result().page, publicationStatus: "published", onSaved: saved => adopted.push(saved),
    fetchImpl: async (url, options) => { calls.push(options); return Response.json(result(nextRevision)); } });
  assert.equal(calls[0].headers["If-Match"], `"${revision}"`);
  assert.equal(calls[1].headers["If-Match"], `"${nextRevision}"`);
  assert.deepEqual(JSON.parse(calls[1].body), { action: "publish" });
  assert.equal(adopted.length, 2);
});
test("partial publication failure keeps the saved draft and never retries", async () => {
  let count = 0, adopted;
  await assert.rejects(saveAzuraPage({ id, revision, draft: result().page, publicationStatus: "published", onSaved: saved => { adopted = saved; },
    fetchImpl: async () => ++count === 1 ? Response.json(result(nextRevision)) : Response.json({ error: "Conflict" }, { status: 409 }) }),
  error => error.status === 409 && error.saved.revision === nextRevision && error.message.includes("Taslak kaydedildi"));
  assert.equal(count, 2); assert.equal(adopted.revision, nextRevision);
});
test("initial conflict preserves client draft without invoking publication", async () => {
  let count = 0, adopted = false;
  await assert.rejects(saveAzuraPage({ id, revision, draft: result().page, publicationStatus: "published", onSaved: () => { adopted = true; },
    fetchImpl: async () => { count++; return Response.json({ error: "Conflict" }, { status: 409 }); } }), { status: 409 });
  assert.equal(count, 1); assert.equal(adopted, false);
});
