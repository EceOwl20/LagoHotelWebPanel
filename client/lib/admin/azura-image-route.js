import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { assertSameOrigin, consumeRateLimit, getClientIp } from "@/lib/admin/security";
import { requestAzuraImages } from "@/lib/admin/azura-experience-images.mjs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 128 * 1024;
const MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(error) {
  return json({ error: error.message || "Azura görsel bağlantısı başarısız oldu." }, error.status || 502);
}

async function readLimitedMultipart(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_MULTIPART_BYTES) {
      await reader.cancel();
      const error = new Error("Görsel yüklemesi 8 MiB sınırını aşıyor.");
      error.status = 413;
      throw error;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function getAzuraImages(scope) {
  const session = await getAdminSession();
  if (!session) return json({ error: "Yetkisiz işlem." }, 401);
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    return json({ images: await requestAzuraImages("GET", undefined, { scope }) });
  } catch (error) {
    return failure(error);
  }
}

export async function postAzuraImage(request, scope) {
  const session = await getAdminSession();
  if (!session) return json({ error: "Yetkisiz işlem." }, 401);
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    assertSameOrigin(request);
  } catch (error) {
    return failure(error);
  }

  const rateLimit = consumeRateLimit({
    key: `admin-upload:azura-homepage:${getClientIp(request)}`,
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.ok) return json({ error: "Çok hızlı görsel yüklendi." }, 429);
  const contentType = request.headers.get("content-type") || "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    return json({ error: "Content-Type multipart/form-data olmalıdır." }, 415);
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_MULTIPART_BYTES) {
    return json({ error: "Görsel yüklemesi 8 MiB sınırını aşıyor." }, 413);
  }
  try {
    const body = await readLimitedMultipart(request);
    if (!body) return json({ error: "Dosya eksik." }, 400);
    let form;
    try {
      form = await new Request("http://localhost/upload", {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      }).formData();
    } catch {
      return json({ error: "Yükleme gövdesi bozuk." }, 400);
    }
    const entries = [...form.entries()];
    if (entries.length !== 1 || entries[0][0] !== "file" ||
        !(entries[0][1] instanceof Blob) || typeof entries[0][1].name !== "string") {
      return json({ error: "Yalnızca tek bir görsel dosyası yüklenebilir." }, 400);
    }
    const file = entries[0][1];
    if (!MIME_TYPES.includes(file.type)) return json({ error: "Yalnızca JPEG, PNG veya WebP yüklenebilir." }, 415);
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return json({ error: "Görsel boş veya 8 MiB sınırını aşıyor." }, file.size > MAX_IMAGE_BYTES ? 413 : 400);
    }
    return json(await requestAzuraImages("POST", file, { scope }), 201);
  } catch (error) {
    return failure(error);
  }
}
