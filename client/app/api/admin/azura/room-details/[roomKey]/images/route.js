import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { getAzuraImages, postAzuraImage } from "@/lib/admin/azura-image-route";
import { azuraRoomDetailConfig } from "@/lib/admin/room-detail-model.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request, params, method) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  const { roomKey } = await params;
  const config = azuraRoomDetailConfig(roomKey);
  if (!config) return NextResponse.json({ error: "Etkin olmayan oda kimliği." }, { status: 404 });
  return method === "GET" ? getAzuraImages(config.imagesScope) : postAzuraImage(request, config.imagesScope);
}
export async function GET(request, { params }) { return handle(request, params, "GET"); }
export async function POST(request, { params }) { return handle(request, params, "POST"); }
