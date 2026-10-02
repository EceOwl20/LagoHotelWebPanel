import { panelSiteAccessResponse } from "@/lib/admin/authorization";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { readAzuraBlogNotificationSummary } from "@/lib/admin/azura-blog-notifications.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  const siteDenied = panelSiteAccessResponse(session, "azura");
  if (siteDenied) return siteDenied;

  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz işlem." },
      { status: 401 }
    );
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);

    const summary = await readAzuraBlogNotificationSummary();

    return NextResponse.json(
      { summary },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Azura blog bildirimleri alınamadı.",
      },
      {
        status: error.status || 502,
      }
    );
  }
}
