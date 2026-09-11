import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadFilePath } from "@/lib/admin/storage";

export const dynamic = "force-dynamic";

const IMAGE_CONTENT_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function notFoundResponse() {
  return NextResponse.json(
    { error: "Görsel bulunamadı." },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(_request, { params }) {
  const { segments } = await params;

  if (!Array.isArray(segments) || segments.length === 0) {
    return notFoundResponse();
  }

  const uploadUrl = `/uploads/${segments.join("/")}`;
  const contentType = IMAGE_CONTENT_TYPES[path.extname(uploadUrl).toLowerCase()];

  if (!contentType) {
    return notFoundResponse();
  }

  try {
    const file = await readFile(getUploadFilePath(uploadUrl));

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(file.byteLength),
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    if (["EACCES", "EISDIR", "ENOENT"].includes(error?.code)) {
      return notFoundResponse();
    }

    throw error;
  }
}
