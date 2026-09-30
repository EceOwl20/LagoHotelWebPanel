import { requestAzuraPages } from "./azura-pages.mjs";
import { createPageNotificationSummary } from "@/lib/pages/page-notification-summary.mjs";

export async function readAzuraPageNotificationSummary() {
  const result = await requestAzuraPages("GET");

  const records = result.pages.map((item) => item.record);

  return createPageNotificationSummary(records);
}