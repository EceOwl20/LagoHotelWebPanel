import AzuraDashboardClient from "./AzuraDashboardClient";
import { getAzuraBlogVersion } from "@/lib/admin/azura-blog-version.mjs";

export const dynamic = "force-dynamic";

export default function AzuraDashboardPage() {
  const azuraBlogVersion =
    getAzuraBlogVersion();

  return (
    <AzuraDashboardClient
      azuraBlogVersion={
        azuraBlogVersion
      }
    />
  );
}