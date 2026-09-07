import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE_NAME } from "./constants";
import { findPanelUserById } from "./users";
import { resolveSessionSecret } from "./session-secret.mjs";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getSessionSecretConfig() {
  return resolveSessionSecret({
    secret: process.env.ADMIN_SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}

function getSessionSecretOrThrow() {
  const secretConfig = getSessionSecretConfig();

  if (!secretConfig.valid) {
    throw new Error(secretConfig.error);
  }

  return secretConfig.value;
}

export function getAdminSecurityConfig() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || "";
  const sessionSecretConfig = getSessionSecretConfig();
  const usingDefaultPassword = !passwordHash && !password && !isProduction();

  return {
    username,
    password,
    passwordHash,
    sessionSecret,
    isConfigured:
      Boolean(username) &&
      Boolean(passwordHash || password || !isProduction()) &&
      sessionSecretConfig.valid,
    canUseDefaults: !isProduction(),
    usingDefaultPassword,
  };
}

export function assertAdminSecurityConfig() {
  const config = getAdminSecurityConfig();

  if (!isProduction()) {
    return config;
  }

  if (!config.username) {
    throw new Error("ADMIN_USERNAME tanimlanmali.");
  }

  const sessionSecretConfig = getSessionSecretConfig();

  if (!sessionSecretConfig.valid) {
    throw new Error(sessionSecretConfig.error);
  }

  if (!config.passwordHash && !config.password) {
    throw new Error(
      "Production icin ADMIN_PASSWORD veya tercihen ADMIN_PASSWORD_HASH tanimlanmali."
    );
  }

  if (
    config.username === "admin" &&
    (!config.passwordHash && config.password === "admin123")
  ) {
    throw new Error("Production ortaminda varsayilan admin bilgileri kullanilamaz.");
  }

  return config;
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload, secret = getSessionSecretOrThrow()) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(user) {
  const payload = JSON.stringify({
    userId: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    role: user.role,
    sessionVersion: user.sessionVersion || 1,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
  const encodedPayload = toBase64Url(payload);
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const secretConfig = getSessionSecretConfig();

  if (!secretConfig.valid) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  const expectedSignature = signPayload(encodedPayload, secretConfig.value);

  if (
    !providedSignature ||
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    )
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload));

    if (!parsed.username || !parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  if (session.userId === "environment-admin") {
    const config = getAdminSecurityConfig();
    return session.username === config.username && session.role === "admin"
      ? session
      : null;
  }

  const user = await findPanelUserById(session.userId);

  if (
    !user ||
    !user.active ||
    user.username !== session.username ||
    user.role !== session.role ||
    user.sessionVersion !== session.sessionVersion
  ) {
    return null;
  }

  return {
    ...session,
    displayName: user.displayName,
  };
}

export function applyAdminSessionCookie(response, user) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
