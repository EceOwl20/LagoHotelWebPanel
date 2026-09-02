import "server-only";

import { createMemoryRateLimiter } from "./rate-limit.mjs";

const globalStore = globalThis;

if (typeof globalStore.__lagoRateLimitStore?.consume !== "function") {
  globalStore.__lagoRateLimitStore = createMemoryRateLimiter();
}

const rateLimiter = globalStore.__lagoRateLimitStore;

function normalizeClientIp(value) {
  const candidate = String(value || "").trim();

  if (!candidate || candidate.length > 64 || !/^[0-9a-f.:\[\]-]+$/i.test(candidate)) {
    return "unknown";
  }

  return candidate;
}

export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return normalizeClientIp(forwardedFor.split(",")[0]);
  }

  return normalizeClientIp(request.headers.get("x-real-ip"));
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  const protocol =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const expectedOrigin = `${protocol}://${host}`;

  if (origin !== expectedOrigin) {
    const error = new Error("Origin dogrulamasi basarisiz.");
    error.status = 403;
    throw error;
  }
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}) {
  return rateLimiter.consume({ key, limit, windowMs });
}

export function checkRateLimit({ key, limit, windowMs }) {
  return rateLimiter.check({ key, limit, windowMs });
}

export function resetRateLimit(key) {
  rateLimiter.reset(key);
}
