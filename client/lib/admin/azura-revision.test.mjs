import assert from "node:assert/strict";
import test from "node:test";
import { isValidAzuraRevision, readAzuraRevision } from "./azura-revision.mjs";

test("yalnızca 64 karakterlik SHA-256 hex sürümü kabul edilir", () => {
  const revision = "a".repeat(64);
  assert.equal(isValidAzuraRevision(revision), true);
  assert.equal(isValidAzuraRevision("a".repeat(63)), false);
  assert.equal(isValidAzuraRevision("A".repeat(64)), false);
  assert.equal(readAzuraRevision({ revision }), revision);
  assert.equal(readAzuraRevision({}), null);
  assert.equal(readAzuraRevision({ revision: "bad" }), undefined);
});
