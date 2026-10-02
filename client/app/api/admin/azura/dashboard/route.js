import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { panelSiteAccessResponse } from "@/lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  const siteDenied = panelSiteAccessResponse(session, "azura");
  if (siteDenied) return siteDenied;
  return NextResponse.json({
    namespaceCount: 14,
    categoryCount: 0,
    imageCount: 0,
    postCount: 0,
    pages: [],
    latestPostTitle: null,
  });
}
