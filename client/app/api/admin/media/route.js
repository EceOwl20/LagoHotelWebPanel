import { NextResponse } from "next/server";
import {
  assertPanelPermission,
  panelSiteAccessResponse,
} from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";
import { readMediaLibrary } from "@/lib/admin/media-library";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  const siteDenied = panelSiteAccessResponse(session, "lago");
  if (siteDenied) return siteDenied;

  try {
    assertPanelPermission(
      session,
      PANEL_PERMISSIONS.EDIT_CONTENT
    );

    const library = await readMediaLibrary();

    return NextResponse.json({ library });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Medya kütüphanesi okunamadı.",
      },
      {
        status: error.status || 500,
      }
    );
  }
}