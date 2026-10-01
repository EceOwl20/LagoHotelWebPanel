import { NextResponse } from "next/server";
import {
  assertPanelPermission,
  assertPanelSiteAccess,
} from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";
import { requestAzuraMediaLibrary } from "@/lib/admin/azura-media-library.mjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Yetkisiz işlem." },
      { status: 401 }
    );
  }

  try {
    assertPanelSiteAccess(session, "azura");

    assertPanelPermission(
      session,
      PANEL_PERMISSIONS.EDIT_CONTENT
    );

    const result =
      await requestAzuraMediaLibrary(
        request.nextUrl.searchParams
      );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Azura medya kütüphanesi okunamadı.",
      },
      {
        status: error.status || 500,
      }
    );
  }
}