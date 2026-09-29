import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { assertSameOrigin, consumeRateLimit, getClientIp } from "@/lib/admin/security";
import { requestAzuraPages } from "./azura-pages.mjs";

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
async function readBody(request, empty) {
  if (!empty && !/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get("content-type") || "")) fail("Content-Type application/json olmalıdır.", 415);
  if (Number(request.headers.get("content-length")) > 128 * 1024) fail("İstek çok büyük.", 413);
  const reader = request.body?.getReader(), chunks = [];
  let size = 0;
  if (reader) while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (empty && size) { await reader.cancel(); fail("İstek gövdesiz olmalıdır."); }
    if (size > 128 * 1024) { await reader.cancel(); fail("İstek çok büyük.", 413); }
    chunks.push(value);
  }
  if (empty) return undefined;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { fail("Geçersiz JSON."); }
}

export function azuraPagesHandler(method, scope = "collection") {
  return async (request, context) => {
    const session = await getAdminSession();
    if (!session) return json({ error: "Yetkisiz işlem." }, 401);
    try {
      assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
      const params = scope === "collection" ? {} : await context.params;
      let body, revision;
      if (method !== "GET") {
        assertSameOrigin(request);
        if (method === "DELETE") assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
        if (!consumeRateLimit({ key: `admin-write:azura-pages:${getClientIp(request)}`, limit: 60, windowMs: 60000 }).ok) fail("Çok hızlı istek gönderildi.", 429);
        if (["PUT", "DELETE"].includes(method) || scope === "restore") {
          const header = request.headers.get("if-match");
          if (!header) fail("If-Match zorunludur.", 428);
          if (!/^"[a-f0-9]{64}"$/.test(header)) fail("If-Match geçersiz.");
          revision = header.slice(1, -1);
        }
        body = await readBody(request, method === "DELETE" || scope === "restore");
        if (method === "PUT" && body?.action !== "save") assertPanelPermission(session, PANEL_PERMISSIONS.PUBLISH_CONTENT);
      }
      return json(await requestAzuraPages(method, body, {
        id: params.id, versionId: scope === "restore" ? params.versionId : undefined,
        history: scope === "history", revision,
      }), method === "POST" && scope === "collection" ? 201 : 200);
    } catch (error) { return json({ error: error.message || "Sayfa bağlantısı başarısız." }, error.status || 502); }
  };
}
