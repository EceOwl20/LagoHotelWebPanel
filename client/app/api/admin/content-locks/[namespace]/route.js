import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import {
  acquireContentEditLock,
  heartbeatContentEditLock,
  releaseContentEditLock,
  serializeContentEditLock,
} from "@/lib/admin/edit-locks";
import { listMessageNamespaces } from "@/lib/admin/messages";
import { getContentEditResourceKey } from "@/lib/admin/content-edit-resources.mjs";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

function lockErrorResponse(error, session) {
  return NextResponse.json(
    {
      error: error.message || "Düzenleme kilidi işlemi tamamlanamadı.",
      lock: error.lock ? serializeContentEditLock(error.lock, session) : null,
    },
    { status: error.status || 500 }
  );
}

export async function POST(request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-content-lock:${session.userId}:${getClientIp(request)}`,
    limit: 40,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı kilit isteği gönderildi. Lütfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { namespace: resourceKey } = await params;
    const availableNamespaces = await listMessageNamespaces();
    const availableResourceKeys = new Set(
      availableNamespaces.map(getContentEditResourceKey)
    );

    if (!availableResourceKeys.has(resourceKey)) {
      return NextResponse.json({ error: "İçerik alanı bulunamadı." }, { status: 404 });
    }

    const body = await request.json();
    const action = body?.action || "acquire";
    const clientId = String(body?.clientId || "");
    const lockToken = String(body?.lockToken || "");

    if (action === "release") {
      const released = releaseContentEditLock(resourceKey, session, lockToken);
      return NextResponse.json({ released });
    }

    if (action === "heartbeat") {
      const lock = heartbeatContentEditLock(resourceKey, session, lockToken);
      return NextResponse.json({
        lock: serializeContentEditLock(lock, session),
        lockToken: lock.token,
      });
    }

    if (!["acquire", "takeover"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz kilit işlemi." }, { status: 400 });
    }

    if (!/^[0-9a-f-]{36}$/i.test(clientId)) {
      return NextResponse.json({ error: "Geçersiz editör sekmesi kimliği." }, { status: 400 });
    }

    if (action === "takeover") {
      assertPanelPermission(session, PANEL_PERMISSIONS.OVERRIDE_EDIT_LOCK);
    }

    const lock = acquireContentEditLock(resourceKey, session, {
      clientId,
      force: action === "takeover",
    });

    return NextResponse.json({
      lock: serializeContentEditLock(lock, session),
      lockToken: lock.token,
    });
  } catch (error) {
    return lockErrorResponse(error, session);
  }
}
