import test from "node:test";
import assert from "node:assert/strict";
import { createMediaScanLimit } from "./media-scan-limit.mjs";
import { createAsyncCache } from "./async-cache.mjs";

test("two concurrent scans share a four-operation ceiling and preserve all results", async () => {
  const limit = createMediaScanLimit(4);
  let active = 0, peak = 0;
  const scan = () => Promise.all(Array.from({ length: 72 }, (_, index) => limit(async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return index;
  })));
  const results = await Promise.all([scan(), scan()]);
  assert.equal(peak, 4);
  for (const result of results) assert.deepEqual(result, Array.from({ length: 72 }, (_, i) => i));
});

test("failed operations release slots and permit retries", async () => {
  const limit = createMediaScanLimit(1);
  const failed = limit(() => { throw new Error("disk error"); });
  const next = limit(() => "ok");
  await assert.rejects(failed, /disk error/);
  assert.equal(await next, "ok");
  assert.equal(await limit(() => "retry"), "retry");
});

test("existing cache coalesces cold requests, caches warm requests and reloads after invalidation", async () => {
  const limit = createMediaScanLimit(4);
  let scans = 0;
  const cache = createAsyncCache({ ttlMs: 30_000, load: () => limit(async () => ++scans) });
  assert.deepEqual(await Promise.all([cache.get(), cache.get()]), [1, 1]);
  assert.equal(await cache.get(), 1);
  cache.invalidate();
  assert.equal(await cache.get(), 2);
});
