import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { assertSameOrigin, consumeRateLimit, getClientIp } from "@/lib/admin/security";
import {
  isValidAzuraSharedContactDetails,
  requestAzuraSharedContactDetails,
} from "@/lib/admin/azura-shared-contact.mjs";
import { isValidAzuraRevision } from "@/lib/admin/azura-revision.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 64 * 1024;

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(error) {
  return json({ error: error.message || "Azura iletişim bağlantısı başarısız oldu." }, error.status || 502);
}

async function readLimitedJson(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      const error = new Error("İstek gövdesi çok büyük.");
      error.status = 413;
      throw error;
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Geçersiz JSON.");
    error.status = 400;
    throw error;
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return json({ error: "Yetkisiz işlem." }, 401);
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    return json(await requestAzuraSharedContactDetails("GET"));
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request) {
  const session = await getAdminSession();
  if (!session) return json({ error: "Yetkisiz işlem." }, 401);
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    assertSameOrigin(request);
  } catch (error) {
    return failure(error);
  }
  const rateLimit = consumeRateLimit({
    key: `admin-write:azura-shared-contact:${getClientIp(request)}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.ok) return json({ error: "Çok hızlı istek gönderildi." }, 429);
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return json({ error: "İstek gövdesi çok büyük." }, 413);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Content-Type application/json olmalıdır." }, 415);
  }
  try {
    const body = await readLimitedJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).length !== 2 ||
        !Object.hasOwn(body, "details") || !Object.hasOwn(body, "revision") ||
        !isValidAzuraRevision(body.revision) ||
        !isValidAzuraSharedContactDetails(body.details)) {
      return json({ error: "Azura iletişim içeriği veya sürümü geçersiz." }, 400);
    }
    return json(await requestAzuraSharedContactDetails("PUT", body.details, { revision: body.revision }));
  } catch (error) {
    return failure(error);
  }
}
