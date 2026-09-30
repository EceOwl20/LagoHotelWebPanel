import { isPanelRole } from "./permissions.mjs";

export const PANEL_USERNAME_PATTERN = /^[a-z0-9._-]{3,64}$/;

export function normalizePanelUsername(value) {
  return String(value || "").trim().toLocaleLowerCase("tr");
}

export const PANEL_SITES = Object.freeze([
  "lago",
  "azura",
]);



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

   const requestedSites = Array.isArray(input?.sites)
    ? [
        ...new Set(
          input.sites
            .map((site) =>
              String(site || "").trim().toLowerCase()
            )
            .filter(Boolean)
        ),
      ]
    : [];

  const invalidSites = requestedSites.filter(
    (site) => !PANEL_SITES.includes(site)
  );

  let sites = [];

  if (role === "admin") {
    // Admin her zaman tüm otellere erişebilir.
    sites = [...PANEL_SITES];
  } else if (role === "editor") {
    if (invalidSites.length > 0) {
      errors.push("Geçersiz otel seçimi.");
    }

    sites = requestedSites.filter((site) =>
      PANEL_SITES.includes(site)
    );

    if (sites.length !== 1) {
      errors.push(
        "Editör için tam olarak bir otel seçilmelidir."
      );
    }
  }


  return { value: { username, displayName, role, sites, password }, errors };
}
