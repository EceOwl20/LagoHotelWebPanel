import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { ensureDir, uploadsRoot } from "@/lib/admin/storage";
import { getAdminSession } from "@/lib/admin/session";
import { writeFile } from "fs/promises";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
]);
const PAGE_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_ROOT_FOLDERS = new Set(["gallery", "blog", "misc", "pages"]);
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-upload:${getClientIp(request)}`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Yukleme limiti asildi. Lutfen biraz bekleyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "misc")
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/^\/+/, "")
    .trim();

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Yüklenecek dosya bulunamadı." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Dosya boyutu 10MB sinirini asamaz." },
      { status: 400 }
    );
  }

  const extension = path.extname(file.name || "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Bu dosya uzantısı desteklenmiyor." }, { status: 400 });
  }

  const rootFolder = folder.split("/")[0] || "misc";

  if (!ALLOWED_ROOT_FOLDERS.has(rootFolder)) {
    return NextResponse.json(
      { error: "Bu yukleme klasoru izinli degil." },
      { status: 400 }
    );
  }

  if (rootFolder === "pages" && !PAGE_IMAGE_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Sayfalarda yalnızca JPG, PNG, WEBP veya GIF görselleri kullanılabilir." },
      { status: 400 }
    );
  }

  const targetDirectory = path.join(uploadsRoot, folder);
  await ensureDir(targetDirectory);

  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const targetFilePath = path.join(targetDirectory, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(targetFilePath, buffer);

  return NextResponse.json({
    url: `/uploads/${folder}/${fileName}`,
    name: fileName,
  });
}
