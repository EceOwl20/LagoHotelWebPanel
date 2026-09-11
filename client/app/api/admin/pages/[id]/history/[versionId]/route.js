import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { readPageHistoryVersion } from "@/lib/admin/pages";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";

export async function GET(_request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    const { id, versionId } = await params;
    const historyVersion = await readPageHistoryVersion(id, versionId);

    return NextResponse.json(historyVersion, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Geçmiş sürüm alınamadı." },
      { status: error.status || 500 }
    );
  }
}
