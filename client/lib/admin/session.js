import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE_NAME } from "./constants";
import { hashAdminPassword, verifyAdminPassword } from "./password.mjs";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "change-me-before-production";
}

export function getAdminSecurityConfig() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || "";
  const usingDefaultPassword = !passwordHash && !password && !isProduction();

  return {
    username,
    password,
    passwordHash,
    sessionSecret,
    isConfigured:
      Boolean(username) &&
      Boolean(passwordHash || password || !isProduction()) &&
      Boolean(sessionSecret || !isProduction()),
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

  if (!config.sessionSecret || config.sessionSecret === "change-me-before-production") {
    throw new Error("Production icin guclu bir ADMIN_SESSION_SECRET tanimlanmali.");
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

function signPayload(payload) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(username) {
  const payload = JSON.stringify({
    username,
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

  const [encodedPayload, providedSignature] = token.split(".");
  const expectedSignature = signPayload(encodedPayload);

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
  return verifySessionToken(token);
}

export function applyAdminSessionCookie(response, username) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createSessionToken(username), {
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
