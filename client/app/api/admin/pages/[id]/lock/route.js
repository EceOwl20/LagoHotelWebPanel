import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import {
  acquirePageEditLock,
  heartbeatPageEditLock,
  releasePageEditLock,
  serializePageEditLock,
} from "@/lib/admin/edit-locks";
import { readPageDraft } from "@/lib/admin/pages";
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
      lock: error.lock ? serializePageEditLock(error.lock, session) : null,
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
    key: `admin-edit-lock:${session.userId}:${getClientIp(request)}`,
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
    const { id } = await params;
    const page = await readPageDraft(id);

    if (!page) {
      return NextResponse.json({ error: "Sayfa taslağı bulunamadı." }, { status: 404 });
    }

    const body = await request.json();
    const action = body?.action || "acquire";
    const clientId = String(body?.clientId || "");
    const lockToken = String(body?.lockToken || "");

    if (action === "release") {
      const released = releasePageEditLock(id, session, lockToken);
      return NextResponse.json({ released });
    }

    if (action === "heartbeat") {
      const lock = heartbeatPageEditLock(id, session, lockToken);
      return NextResponse.json({
        lock: serializePageEditLock(lock, session),
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

    const lock = acquirePageEditLock(id, session, {
      clientId,
      force: action === "takeover",
    });

    return NextResponse.json({
      lock: serializePageEditLock(lock, session),
      lockToken: lock.token,
    });
  } catch (error) {
    return lockErrorResponse(error, session);
  }
}
