import { requestAzuraDashboardSummary } from "./azura-dashboard-summary.mjs";

export async function readAzuraBlogNotificationSummary() {
  const { notifications } = await requestAzuraDashboardSummary("blog");
  return { draftCount: notifications.total, drafts: notifications.items };
}
