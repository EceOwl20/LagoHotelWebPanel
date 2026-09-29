import { azuraPagesHandler } from "@/lib/admin/azura-pages-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = azuraPagesHandler("POST", "restore");
