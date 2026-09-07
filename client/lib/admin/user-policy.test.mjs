import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePanelUsername,
  normalizePanelUserInput,
} from "./user-policy.mjs";

test("kullanıcı adını boşluk ve büyük harflerden arındırır", () => {
  assert.equal(normalizePanelUsername("  Editor.One  "), "editor.one");
});

test("geçerli admin ve editor kullanıcılarını kabul eder", () => {
  for (const role of ["admin", "editor"]) {
    const result = normalizePanelUserInput(
      { username: `user-${role}`, displayName: "Panel User", password: "guclu-parola", role },
      { passwordRequired: true }
    );
    assert.deepEqual(result.errors, []);
  }
});

test("zayıf parola, bilinmeyen rol ve geçersiz kullanıcı adını reddeder", () => {
  const result = normalizePanelUserInput(
    { username: "x!", displayName: "", password: "123", role: "owner" },
    { passwordRequired: true }
  );
  assert.equal(result.errors.length, 4);
});

test("güncellemede boş parola mevcut parolayı değiştirmeden kabul edilir", () => {
  const result = normalizePanelUserInput({
    username: "editor.one",
    displayName: "Editor One",
    password: "",
    role: "editor",
  });
  assert.deepEqual(result.errors, []);
});
