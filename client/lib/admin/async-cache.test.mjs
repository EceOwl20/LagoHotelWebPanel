import assert from "node:assert/strict";
import test from "node:test";
import { createAsyncCache } from "./async-cache.mjs";

function createDeferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

test("süresi dolmayan değeri yeniden yüklemez", async () => {
  let currentTime = 1_000;
  let loadCount = 0;
  const cache = createAsyncCache({
    ttlMs: 500,
    now: () => currentTime,
    load: async () => ++loadCount,
  });

  assert.equal(await cache.get(), 1);
  assert.equal(await cache.get(), 1);
  assert.equal(loadCount, 1);

  currentTime += 501;
  assert.equal(await cache.get(), 2);
});

test("eş zamanlı istekleri tek yükleme altında birleştirir", async () => {
  const deferred = createDeferred();
  let loadCount = 0;
  const cache = createAsyncCache({
    ttlMs: 1_000,
    load: async () => {
      loadCount += 1;
      return deferred.promise;
    },
  });

  const firstRead = cache.get();
  const secondRead = cache.get();
  deferred.resolve({ value: "library" });

  const [firstValue, secondValue] = await Promise.all([firstRead, secondRead]);
  assert.equal(loadCount, 1);
  assert.equal(firstValue, secondValue);
});

test("geçersiz kılma sonraki okumada yeni değeri yükler", async () => {
  let loadCount = 0;
  const cache = createAsyncCache({
    ttlMs: 10_000,
    load: async () => ++loadCount,
  });

  assert.equal(await cache.get(), 1);
  cache.invalidate();
  assert.equal(await cache.get(), 2);
});

test("yükleme sırasında geçersiz kılınan eski sonucu cache'e yazmaz", async () => {
  const firstLoad = createDeferred();
  let loadCount = 0;
  const cache = createAsyncCache({
    ttlMs: 10_000,
    load: async () => {
      loadCount += 1;
      return loadCount === 1 ? firstLoad.promise : "fresh";
    },
  });

  const pendingRead = cache.get();
  cache.invalidate();
  firstLoad.resolve("stale");

  assert.equal(await pendingRead, "fresh");
  assert.equal(await cache.get(), "fresh");
  assert.equal(loadCount, 2);
});
