import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { listTrashedPageDrafts } from "@/lib/admin/pages";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
    const pages = await listTrashedPageDrafts();
    return NextResponse.json({ pages });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Çöp kutusundaki sayfalar alınamadı." },
      { status: error.status || 500 }
    );
  }
}
