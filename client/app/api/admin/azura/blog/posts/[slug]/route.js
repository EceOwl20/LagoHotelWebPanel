import { azuraBlogHandler } from "@/lib/admin/azura-blog-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = azuraBlogHandler("GET", true);
export const PUT = azuraBlogHandler("PUT", true);
export const DELETE = azuraBlogHandler("DELETE", true);
