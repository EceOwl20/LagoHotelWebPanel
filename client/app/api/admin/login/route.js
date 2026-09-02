import { NextResponse } from "next/server";
import {
  applyAdminSessionCookie,
  assertAdminSecurityConfig,
} from "@/lib/admin/session";
import { verifyAdminPassword } from "@/lib/admin/password.mjs";
import {
  assertSameOrigin,
  checkRateLimit,
  consumeRateLimit,
  getClientIp,
  resetRateLimit,
} from "@/lib/admin/security";

const LOGIN_BURST_LIMIT = { limit: 20, windowMs: 60 * 1000 };
const LOGIN_ACCOUNT_FAILURE_LIMIT = { limit: 15, windowMs: 15 * 60 * 1000 };
const LOGIN_IDENTITY_FAILURE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const LOGIN_IP_FAILURE_LIMIT = { limit: 30, windowMs: 15 * 60 * 1000 };

function createRateLimitResponse(rateLimit) {
  return NextResponse.json(
    { error: "Çok fazla giriş denemesi yapıldı. Lütfen biraz bekleyin." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(rateLimit.retryAfterSeconds),
      },
    }
  );
}

function normalizeLoginIdentifier(username) {
  return encodeURIComponent(String(username || "").trim().toLocaleLowerCase()).slice(
    0,
    256
  ) || "empty";
}

export async function POST(request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const ipAddress = getClientIp(request);
  const burstLimit = consumeRateLimit({
    key: `admin-login-burst:${ipAddress}`,
    ...LOGIN_BURST_LIMIT,
  });

  if (!burstLimit.ok) {
    return createRateLimitResponse(burstLimit);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > 4096) {
    return NextResponse.json(
      { error: "Giriş isteği çok büyük." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }

  let credentials;

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz giriş isteği." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { username, password } = credentials || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 128 ||
    password.length > 1024
  ) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const loginIdentifier = normalizeLoginIdentifier(username);
  const accountFailureKey = `admin-login-account:${loginIdentifier}`;
  const identityFailureKey = `admin-login-identity:${ipAddress}:${loginIdentifier}`;
  const ipFailureKey = `admin-login-ip:${ipAddress}`;
  const activeFailureLimits = [
    checkRateLimit({ key: accountFailureKey, ...LOGIN_ACCOUNT_FAILURE_LIMIT }),
    checkRateLimit({ key: identityFailureKey, ...LOGIN_IDENTITY_FAILURE_LIMIT }),
    checkRateLimit({ key: ipFailureKey, ...LOGIN_IP_FAILURE_LIMIT }),
  ];
  const blockedFailureLimit = activeFailureLimits.find((limit) => !limit.ok);

  if (blockedFailureLimit) {
    return createRateLimitResponse(blockedFailureLimit);
  }

  let configured;

  try {
    configured = assertAdminSecurityConfig();
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const passwordSecret = configured.passwordHash || configured.password || "admin123";
  const passwordIsValid = verifyAdminPassword(password, passwordSecret);
  const usernameIsValid = username === configured.username;

  if (!usernameIsValid || !passwordIsValid) {
    consumeRateLimit({ key: accountFailureKey, ...LOGIN_ACCOUNT_FAILURE_LIMIT });
    consumeRateLimit({ key: identityFailureKey, ...LOGIN_IDENTITY_FAILURE_LIMIT });
    consumeRateLimit({ key: ipFailureKey, ...LOGIN_IP_FAILURE_LIMIT });

    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  resetRateLimit(accountFailureKey);
  resetRateLimit(identityFailureKey);

  const response = NextResponse.json({
    success: true,
    user: { username: configured.username },
  }, { headers: { "Cache-Control": "no-store" } });

  applyAdminSessionCookie(response, configured.username);
  return response;
}
