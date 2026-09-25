import { createAzuraPageContentHandlers } from "@/lib/admin/azura-page-content-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = createAzuraPageContentHandlers("bars");
export const GET = handlers.GET;
export const PUT = handlers.PUT;
