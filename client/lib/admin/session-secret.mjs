export const DEFAULT_SESSION_SECRET = "change-me-before-production";
export const MINIMUM_SESSION_SECRET_LENGTH = 32;

export function resolveSessionSecret({
  secret = "",
  nodeEnv = "development",
} = {}) {
  const normalizedSecret = String(secret || "").trim();
  const isProduction = nodeEnv === "production";

  if (!isProduction) {
    return {
      valid: true,
      value: normalizedSecret || DEFAULT_SESSION_SECRET,
      usesDevelopmentDefault: !normalizedSecret,
      error: null,
    };
  }

  let error = null;

  if (!normalizedSecret) {
    error = "Production için ADMIN_SESSION_SECRET tanımlanmalıdır.";
  } else if (normalizedSecret === DEFAULT_SESSION_SECRET) {
    error = "Production ortamında varsayılan ADMIN_SESSION_SECRET kullanılamaz.";
  } else if (normalizedSecret.length < MINIMUM_SESSION_SECRET_LENGTH) {
    error = `Production için ADMIN_SESSION_SECRET en az ${MINIMUM_SESSION_SECRET_LENGTH} karakter olmalıdır.`;
  }

  return {
    valid: !error,
    value: error ? null : normalizedSecret,
    usesDevelopmentDefault: false,
    error,
  };
}
