import { requestAzuraDashboardSummary } from "./azura-dashboard-summary.mjs";

export async function readAzuraPageNotificationSummary() {
  const { notifications } = await requestAzuraDashboardSummary("pages");
  return { draftCount: notifications.total, drafts: notifications.items };
}
