import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSecurityConfig, getAdminSession } from "@/lib/admin/session";
import { updatePanelUser } from "@/lib/admin/users";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function PUT(request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.MANAGE_USERS);
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:user-update:${getClientIp(request)}`,
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı kullanıcı işlemi yapıldı. Lütfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { id } = await params;
    const { user } = await request.json();
    const savedUser = await updatePanelUser(
      id,
      user,
      session.userId,
      [getAdminSecurityConfig().username]
    );
    return NextResponse.json({ user: savedUser });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Kullanıcı güncellenemedi." },
      { status: error.status || 500 }
    );
  }
}
