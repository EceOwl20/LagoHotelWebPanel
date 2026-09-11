import { NextResponse } from "next/server";
import { readPageNotificationSummary } from "@/lib/admin/pages";
import { getAdminSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const summary = await readPageNotificationSummary();
    return NextResponse.json(
      { summary },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Taslak bildirimleri alınamadı." },
      { status: error.status || 500 }
    );
  }
}
