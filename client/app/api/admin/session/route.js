import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      username: session.username,
      displayName: session.displayName,
      role: session.role,
    },
  });
}
