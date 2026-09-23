import { createAzuraSpaPageHandlers } from "@/lib/admin/azura-spa-page-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handlers = createAzuraSpaPageHandlers("beachpools");
export const GET = handlers.GET;
export const PUT = handlers.PUT;
