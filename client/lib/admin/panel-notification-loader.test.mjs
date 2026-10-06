import test from "node:test";
import assert from "node:assert/strict";
import { createNotificationLoader } from "./panel-notification-loader.mjs";

const ok = () => ({ ok: true, json: async () => ({ summary: { draftCount: 1, drafts: [{ id: "one" }] } }) });
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("fast source appears before slow failure, successful source survives", async () => {
  let rejectBlog;
  const loader = createNotificationLoader((url) => url.includes("blog")
    ? new Promise((_, reject) => { rejectBlog = reject; }) : Promise.resolve(ok()));
  const results = [];
  const done = loader.load(true, (section, result) => results.push([section, result.status]));
  await tick();
  assert.deepEqual(results, [["pages", "ok"]]);
  rejectBlog(new Error("offline"));
  await done;
  assert.deepEqual(results, [["pages", "ok"], ["blog", "error"]]);
});

test("hotel switch aborts old requests and ignores late results even if fetch ignores abort", async () => {
  const requests = [];
  const loader = createNotificationLoader((url, options) => new Promise((resolve) => requests.push({ url, options, resolve })));
  const old = [];
  const first = loader.load(true, (...args) => old.push(args));
  const next = [];
  const second = loader.load(false, (...args) => next.push(args));
  assert.equal(requests[0].options.signal.aborted, true);
  requests.forEach((request) => request.resolve(ok()));
  await Promise.all([first, second]);
  assert.equal(old.length, 0);
  assert.equal(next.length, 1);
  assert.equal(next[0][0], "pages");
});

test("cleanup suppresses callbacks and malformed summaries are errors, not empty success", async () => {
  const results = [];
  const loader = createNotificationLoader(async () => ({ ok: true, json: async () => ({}) }));
  await loader.load(false, (_, result) => results.push(result.status));
  assert.deepEqual(results, ["error"]);
  const pending = loader.load(false, () => assert.fail("cancelled callback"));
  loader.cancel();
  await pending;
});
