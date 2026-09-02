import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryRateLimiter } from "./rate-limit.mjs";

test("limit dolduğunda kalan bekleme süresini döndürür", () => {
  const limiter = createMemoryRateLimiter();
  const options = { key: "login:ip", limit: 2, windowMs: 10_000 };

  assert.equal(limiter.consume({ ...options, now: 1_000 }).ok, true);
  assert.equal(limiter.consume({ ...options, now: 2_000 }).ok, true);

  const blocked = limiter.consume({ ...options, now: 3_000 });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterSeconds, 8);
});

test("kontrol işlemi sayacı artırmaz", () => {
  const limiter = createMemoryRateLimiter();
  const options = { key: "login:user", limit: 1, windowMs: 10_000, now: 1_000 };

  assert.equal(limiter.check(options).ok, true);
  assert.equal(limiter.check(options).ok, true);
  assert.equal(limiter.consume(options).ok, true);
  assert.equal(limiter.check({ ...options, now: 2_000 }).ok, false);
});

test("başarılı giriş sonrası sayaç sıfırlanabilir", () => {
  const limiter = createMemoryRateLimiter();
  const options = { key: "login:user", limit: 1, windowMs: 10_000, now: 1_000 };

  limiter.consume(options);
  assert.equal(limiter.check(options).ok, false);

  limiter.reset(options.key);
  assert.equal(limiter.check(options).ok, true);
});

test("zaman penceresi dolan denemeleri hesaptan çıkarır", () => {
  const limiter = createMemoryRateLimiter();
  const options = { key: "login:user", limit: 1, windowMs: 10_000 };

  limiter.consume({ ...options, now: 1_000 });
  assert.equal(limiter.consume({ ...options, now: 11_000 }).ok, true);
});

test("anahtar sayısını yapılandırılan üst sınırda tutar", () => {
  const limiter = createMemoryRateLimiter({ maxKeys: 2 });

  limiter.consume({ key: "first", limit: 5, windowMs: 10_000, now: 1_000 });
  limiter.consume({ key: "second", limit: 5, windowMs: 10_000, now: 1_000 });
  limiter.consume({ key: "third", limit: 5, windowMs: 10_000, now: 1_000 });

  assert.equal(limiter.size(), 2);
  assert.equal(
    limiter.check({ key: "first", limit: 5, windowMs: 10_000, now: 1_000 }).remaining,
    5
  );
});
