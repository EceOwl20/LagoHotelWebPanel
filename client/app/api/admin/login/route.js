import { NextResponse } from "next/server";
import {
  applyAdminSessionCookie,
  assertAdminSecurityConfig,
} from "@/lib/admin/session";
import { verifyAdminPassword } from "@/lib/admin/password.mjs";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function POST(request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const ipAddress = getClientIp(request);
  const rateLimit = consumeRateLimit({
    key: `admin-login:${ipAddress}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Cok fazla giris denemesi yapildi. Lutfen biraz bekleyin." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const { username, password } = await request.json();
  let configured;

  try {
    configured = assertAdminSecurityConfig();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const passwordSecret = configured.passwordHash || configured.password || "admin123";

  if (
    username !== configured.username ||
    !verifyAdminPassword(password, passwordSecret)
  ) {
    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    user: { username: configured.username },
  });

  applyAdminSessionCookie(response, configured.username);
  return response;
}
