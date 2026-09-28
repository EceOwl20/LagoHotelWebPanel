import { azuraBlogHandler } from "@/lib/admin/azura-blog-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = azuraBlogHandler("GET");
export const POST = azuraBlogHandler("POST");
