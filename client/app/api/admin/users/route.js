import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSecurityConfig, getAdminSession } from "@/lib/admin/session";
import { createPanelUser, listPanelUsers } from "@/lib/admin/users";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

function authorize(session) {
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.MANAGE_USERS);
    return null;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }
}

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const denied = authorize(session);
  if (denied) return denied;

  const users = await listPanelUsers();
  return NextResponse.json({ users });
}

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const denied = authorize(session);
  if (denied) return denied;

  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:users:${getClientIp(request)}`,
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı kullanıcı işlemi yapıldı. Lütfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { user } = await request.json();
    const savedUser = await createPanelUser(user, [getAdminSecurityConfig().username]);
    return NextResponse.json({ user: savedUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Kullanıcı oluşturulamadı." },
      { status: error.status || 500 }
    );
  }
}
