import assert from "node:assert/strict";
import test from "node:test";
import {
  isPermanentDeleteConfirmed,
  PERMANENT_DELETE_CONFIRMATION,
} from "./trash-policy.mjs";

test("kalıcı silme yalnızca tam onay ifadesini kabul eder", () => {
  assert.equal(isPermanentDeleteConfirmed(PERMANENT_DELETE_CONFIRMATION), true);
  assert.equal(isPermanentDeleteConfirmed(` ${PERMANENT_DELETE_CONFIRMATION} `), true);
  assert.equal(isPermanentDeleteConfirmed("kalıcı olarak sil"), false);
  assert.equal(isPermanentDeleteConfirmed("SİL"), false);
  assert.equal(isPermanentDeleteConfirmed(""), false);
});
