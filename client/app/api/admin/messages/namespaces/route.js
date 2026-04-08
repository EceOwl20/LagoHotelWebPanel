import { NextResponse } from "next/server";
import { listMessageNamespaces } from "@/lib/admin/messages";
import { getAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const namespaces = await listMessageNamespaces();
  return NextResponse.json({ namespaces });
}
