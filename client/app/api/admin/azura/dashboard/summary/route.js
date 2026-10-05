import { getAdminSession } from "@/lib/admin/session";
import { panelSiteAccessResponse, assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { requestAzuraDashboardSummary } from "@/lib/admin/azura-dashboard-summary.mjs";

export const dynamic = "force-dynamic";
export async function GET(request) {
  const session = await getAdminSession();
  const denied = panelSiteAccessResponse(session, "azura");
  if (denied) return denied;
  const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some(key => key !== "section") || query.getAll("section").length !== 1) return json({ error: "Geçersiz sorgu." }, 400);
    const summary = await requestAzuraDashboardSummary(query.get("section"));
    return json({ summary });
  } catch (error) { return json({ error: error.message || "Özet alınamadı." }, error.status || 502); }
}
