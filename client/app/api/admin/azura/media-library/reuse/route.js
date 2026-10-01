import { NextResponse } from "next/server";
import { readMediaReuseRequest } from "@/lib/admin/azura-media-library-request.mjs";
import {
  assertPanelPermission,
  assertPanelSiteAccess,
} from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";
import { reuseAzuraMediaLibraryImage } from "@/lib/admin/azura-media-library.mjs";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export const dynamic = "force-dynamic";

export async function POST(request) {
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

    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 403 }
    );
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:azura-media-library:${getClientIp(
      request
    )}`,
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      {
        error:
          "Çok hızlı medya işlemi yapıldı. Lütfen tekrar deneyin.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rateLimit.retryAfterSeconds
          ),
        },
      }
    );
  }

  try {
    const body = await readMediaReuseRequest(request);

    const result =
      await reuseAzuraMediaLibraryImage(body);

    return NextResponse.json(
      result.image,
      {
        status: result.status,
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
          "Azura medya görseli yeniden kullanılamadı.",
      },
      {
        status: error.status || 500,
      }
    );
  }
}
