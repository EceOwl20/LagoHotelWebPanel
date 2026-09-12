import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { readBlogPost } from "@/lib/admin/blog";
import {
  acquireBlogEditLock,
  heartbeatBlogEditLock,
  releaseBlogEditLock,
  serializeBlogEditLock,
} from "@/lib/admin/edit-locks";
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
      error: error.message || "Blog düzenleme kilidi işlemi tamamlanamadı.",
      lock: error.lock ? serializeBlogEditLock(error.lock, session) : null,
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
    key: `admin-blog-edit-lock:${session.userId}:${getClientIp(request)}`,
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
    const { slug } = await params;
    const post = await readBlogPost(slug);

    if (!post) {
      return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });
    }

    const body = await request.json();
    const action = body?.action || "acquire";
    const clientId = String(body?.clientId || "");
    const lockToken = String(body?.lockToken || "");

    if (action === "release") {
      const released = releaseBlogEditLock(slug, session, lockToken);
      return NextResponse.json({ released });
    }

    if (action === "heartbeat") {
      const lock = heartbeatBlogEditLock(slug, session, lockToken);
      return NextResponse.json({
        lock: serializeBlogEditLock(lock, session),
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

    const lock = acquireBlogEditLock(slug, session, {
      clientId,
      force: action === "takeover",
    });

    return NextResponse.json({
      lock: serializeBlogEditLock(lock, session),
      lockToken: lock.token,
    });
  } catch (error) {
    return lockErrorResponse(error, session);
  }
}
