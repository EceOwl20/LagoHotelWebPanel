import "server-only";

const globalStore = globalThis;

if (!globalStore.__lagoRateLimitStore) {
  globalStore.__lagoRateLimitStore = new Map();
}

const rateLimitStore = globalStore.__lagoRateLimitStore;

export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
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
  const now = Date.now();
  const bucket = rateLimitStore.get(key) || [];
  const activeEntries = bucket.filter((timestamp) => now - timestamp < windowMs);

  if (activeEntries.length >= limit) {
    const oldestAllowed = activeEntries[0] + windowMs;
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldestAllowed - now) / 1000)),
    };
  }

  activeEntries.push(now);
  rateLimitStore.set(key, activeEntries);

  return { ok: true, retryAfterSeconds: 0 };
}
