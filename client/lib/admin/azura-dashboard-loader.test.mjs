import assert from "node:assert/strict";
import test from "node:test";
import { loadDashboardSections } from "./azura-dashboard-loader.mjs";

function setup() {
  const pending = {}, results = {}, options = {};
  const controller = new AbortController();
  const tasks = loadDashboardSections({ version: 3, signal: controller.signal,
    onResult: (key, result) => { results[key] = result; },
    fetchImpl: (url, config) => new Promise(resolve => {
      const key = url.split("/").at(-1);
      pending[key] = resolve; options[key] = config;
    }),
  });
  return { pending, results, tasks, options, controller };
}
test("slow gallery does not block blog or pages; V3 header and signal are preserved", async () => {
  const h = setup();
  assert.equal(Object.keys(h.pending).length, 3);
  h.pending.posts(Response.json({ posts: [{ slug: "sample" }] }));
  await h.tasks[1];
  assert.equal(h.results.posts.data.length, 1);
  assert.equal(h.results.gallery, undefined);
  h.pending.pages(Response.json({ pages: [] }));
  await h.tasks[2];
  assert.deepEqual(h.results.pages.data, []);
  assert.equal(h.results.gallery, undefined);
  assert.equal(new Headers(h.options.posts.headers).get("x-azura-blog-contract-version"), "3");
  assert.equal(h.options.posts.signal, h.controller.signal);
  h.pending.gallery(Response.json({ error: "Galeri zaman aşımı" }, { status: 504 }));
  await h.tasks[0];
  assert.equal(h.results.gallery.error, "Galeri zaman aşımı");
  assert.equal(h.results.posts.data.length, 1);
});
test("malformed response fails only its section, valid empty gallery succeeds", async () => {
  const h = setup();
  h.pending.gallery(Response.json({ gallery: { categories: [] } }));
  h.pending.posts(Response.json({ posts: null }));
  h.pending.pages(new Response("not json"));
  await Promise.all(h.tasks);
  assert.deepEqual(h.results.gallery, { data: [], error: "" });
  assert.ok(h.results.posts.error);
  assert.ok(h.results.pages.error);
});
test("aborted view cannot receive late results", async () => {
  const h = setup();
  h.controller.abort();
  h.pending.gallery(Response.json({ gallery: { categories: [] } }));
  h.pending.posts(Response.json({ posts: [] }));
  h.pending.pages(Response.json({ pages: [] }));
  await Promise.all(h.tasks);
  assert.deepEqual(h.results, {});
});
