import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPanelPermission,
  isPanelRole,
  PANEL_PERMISSIONS,
} from "./permissions.mjs";

test("admin bütün panel yetkilerine sahiptir", () => {
  for (const permission of Object.values(PANEL_PERMISSIONS)) {
    assert.equal(hasPanelPermission("admin", permission), true);
  }
});

test("editor içerik düzenleyebilir ancak yayınlama, silme ve kullanıcı yönetemez", () => {
  assert.equal(hasPanelPermission("editor", PANEL_PERMISSIONS.EDIT_CONTENT), true);
  assert.equal(hasPanelPermission("editor", PANEL_PERMISSIONS.PUBLISH_CONTENT), false);
  assert.equal(hasPanelPermission("editor", PANEL_PERMISSIONS.DELETE_CONTENT), false);
  assert.equal(hasPanelPermission("editor", PANEL_PERMISSIONS.MANAGE_USERS), false);
  assert.equal(hasPanelPermission("editor", PANEL_PERMISSIONS.OVERRIDE_EDIT_LOCK), false);
});

test("bilinmeyen roller hiçbir yetki kazanamaz", () => {
  assert.equal(isPanelRole("admin"), true);
  assert.equal(isPanelRole("editor"), true);
  assert.equal(isPanelRole("owner"), false);
  assert.equal(hasPanelPermission("owner", PANEL_PERMISSIONS.EDIT_CONTENT), false);
});
