import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin/session";
import { assertSameOrigin } from "@/lib/admin/security";

export async function POST(request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const response = NextResponse.json({ success: true });
  clearAdminSessionCookie(response);
  return response;
}
