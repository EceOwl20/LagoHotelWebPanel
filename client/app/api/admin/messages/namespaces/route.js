import { panelSiteAccessResponse } from "@/lib/admin/authorization";
import { NextResponse } from "next/server";
import { listMessageNamespaces } from "@/lib/admin/messages";
import { getAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await getAdminSession();
  const siteDenied = panelSiteAccessResponse(session, "lago");
  if (siteDenied) return siteDenied;

  const namespaces = await listMessageNamespaces();
  return NextResponse.json({ namespaces });
}
