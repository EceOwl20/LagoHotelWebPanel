// app/api/admin/azura/pages/summary/route.js

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { readAzuraPageNotificationSummary } from "@/lib/admin/azura-pages-notifications.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz işlem." },
      { status: 401 }
    );
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);

    const summary = await readAzuraPageNotificationSummary();

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
          "Azura taslak bildirimleri alınamadı.",
      },
      {
        status: error.status || 502,
      }
    );
  }
}