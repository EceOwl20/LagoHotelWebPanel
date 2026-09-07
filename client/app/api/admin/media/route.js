import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { readMediaLibrary } from "@/lib/admin/media-library";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const library = await readMediaLibrary();
    return NextResponse.json({ library });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Medya kütüphanesi okunamadı." },
      { status: 500 }
    );
  }
}
