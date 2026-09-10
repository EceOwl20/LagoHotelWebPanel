import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { permanentlyDeleteTrashedPage } from "@/lib/admin/pages";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function DELETE(request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 403 }
    );
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:page-permanent-delete:${getClientIp(request)}`,
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı istek gönderildi. Lütfen tekrar deneyin." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const deletedPage = await permanentlyDeleteTrashedPage(
      id,
      body.confirmation
    );
    return NextResponse.json({ deletedPage });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Dinamik sayfa kalıcı olarak silinemedi." },
      { status: error.status || 500 }
    );
  }
}
