import { getAzuraImages, postAzuraImage } from "@/lib/admin/azura-image-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return getAzuraImages("dynamic-pages"); }
export async function POST(request) { return postAzuraImage(request, "dynamic-pages"); }
