import { isPanelRole } from "./permissions.mjs";

export const PANEL_USERNAME_PATTERN = /^[a-z0-9._-]{3,64}$/;

export function normalizePanelUsername(value) {
  return String(value || "").trim().toLocaleLowerCase("tr");
}

export function normalizePanelUserInput(input, { passwordRequired = false } = {}) {
  const username = normalizePanelUsername(input?.username);
  const displayName = String(input?.displayName || "").trim();
  const role = input?.role;
  const password = typeof input?.password === "string" ? input.password : "";
  const errors = [];

  if (!PANEL_USERNAME_PATTERN.test(username)) {
    errors.push("Kullanıcı adı 3-64 karakter olmalı; yalnızca küçük harf, rakam, nokta, tire ve alt çizgi içermelidir.");
  }

  if (!displayName || displayName.length > 100) {
    errors.push("Ad soyad 1-100 karakter arasında olmalıdır.");
  }

  if (!isPanelRole(role)) {
    errors.push("Geçersiz kullanıcı rolü.");
  }

  if ((passwordRequired || password) && (password.length < 10 || password.length > 256)) {
    errors.push("Parola 10-256 karakter arasında olmalıdır.");
  }

  return { value: { username, displayName, role, password }, errors };
}
