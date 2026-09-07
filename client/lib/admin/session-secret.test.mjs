import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SESSION_SECRET,
  MINIMUM_SESSION_SECRET_LENGTH,
  resolveSessionSecret,
} from "./session-secret.mjs";

test("development ortamında eksik secret kontrollü varsayılana döner", () => {
  const result = resolveSessionSecret({ nodeEnv: "development", secret: "" });
  assert.equal(result.valid, true);
  assert.equal(result.value, DEFAULT_SESSION_SECRET);
  assert.equal(result.usesDevelopmentDefault, true);
});

test("production ortamında eksik veya yalnızca boşluk olan secret reddedilir", () => {
  for (const secret of ["", "   "]) {
    const result = resolveSessionSecret({ nodeEnv: "production", secret });
    assert.equal(result.valid, false);
    assert.equal(result.value, null);
  }
});

test("production ortamında bilinen varsayılan secret reddedilir", () => {
  const result = resolveSessionSecret({
    nodeEnv: "production",
    secret: DEFAULT_SESSION_SECRET,
  });
  assert.equal(result.valid, false);
  assert.match(result.error, /varsayılan/);
});

test("production ortamında kısa secret reddedilir", () => {
  const result = resolveSessionSecret({
    nodeEnv: "production",
    secret: "a".repeat(MINIMUM_SESSION_SECRET_LENGTH - 1),
  });
  assert.equal(result.valid, false);
  assert.match(result.error, /en az 32/);
});

test("production ortamında yeterince uzun rastgele secret kabul edilir", () => {
  const secret = "a-secure-random-session-secret-value-2026";
  const result = resolveSessionSecret({ nodeEnv: "production", secret });
  assert.equal(result.valid, true);
  assert.equal(result.value, secret);
  assert.equal(result.error, null);
});
