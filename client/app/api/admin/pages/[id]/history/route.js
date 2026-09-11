import { NextResponse } from "next/server";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { listPageHistory } from "@/lib/admin/pages";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";

export async function GET(_request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    const { id } = await params;
    const history = await listPageHistory(id);

    return NextResponse.json(history, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfa geçmişi alınamadı." },
      { status: error.status || 500 }
    );
  }
}
