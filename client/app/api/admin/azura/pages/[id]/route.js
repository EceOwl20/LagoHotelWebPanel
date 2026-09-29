import { azuraPagesHandler } from "@/lib/admin/azura-pages-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = azuraPagesHandler("GET", "detail");
export const PUT = azuraPagesHandler("PUT", "detail");
export const DELETE = azuraPagesHandler("DELETE", "detail");
