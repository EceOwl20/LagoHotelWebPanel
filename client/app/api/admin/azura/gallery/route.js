import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { assertSameOrigin, consumeRateLimit, getClientIp } from "@/lib/admin/security";
import { isValidAzuraRevision } from "@/lib/admin/azura-revision.mjs";
import { exactKeys, isGalleryOperation } from "@/lib/admin/azura-gallery-model.mjs";
import { requestAzuraGallery } from "@/lib/admin/azura-gallery.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const failure = (e) => json({ error: e.message || "Galeri bağlantısı başarısız." }, e.status || 502);
export async function GET() {
  const session = await getAdminSession();
  if (!session) return json({ error: "Yetkisiz işlem." }, 401);
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    return json(await requestAzuraGallery("GET"));
  } catch (e) { return failure(e); }
}
export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) return json({ error: "Yetkisiz işlem." }, 401);
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    assertSameOrigin(request);
    if (!consumeRateLimit({ key: `admin-write:azura-gallery:${getClientIp(request)}`, limit: 60, windowMs: 60000 }).ok) {
      return json({ error: "Çok hızlı istek gönderildi." }, 429);
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) return json({ error: "Content-Type application/json olmalıdır." }, 415);
    if (Number(request.headers.get("content-length") || 0) > 128 * 1024) return json({ error: "İstek çok büyük." }, 413);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "İstek gövdesi eksik." }, 400);
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128 * 1024) { await reader.cancel(); return json({ error: "İstek çok büyük." }, 413); }
      chunks.push(value);
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return json({ error: "Geçersiz JSON." }, 400); }
    if (!exactKeys(body, ["operation", "revision"]) || !isGalleryOperation(body.operation) ||
        !isValidAzuraRevision(body.revision)) return json({ error: "Galeri işlemi veya sürümü geçersiz." }, 400);
    if (body.operation.action === "remove") assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
    return json(await requestAzuraGallery("PATCH", body.operation, { revision: body.revision }));
  } catch (e) { return failure(e); }
}
