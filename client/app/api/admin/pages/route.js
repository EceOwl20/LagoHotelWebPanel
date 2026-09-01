import { NextResponse } from "next/server";
import { createPageDraft, listPageDrafts } from "@/lib/admin/pages";
import { getAdminSession } from "@/lib/admin/session";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const pages = await listPageDrafts();
  return NextResponse.json({ pages });
}

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:pages:${getClientIp(request)}`,
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı istek gönderildi. Lütfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { page } = await request.json();

    if (!page) {
      return NextResponse.json({ error: "Sayfa verisi zorunludur." }, { status: 400 });
    }

    const savedPage = await createPageDraft(page);
    return NextResponse.json({ page: savedPage }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfa taslağı kaydedilemedi." },
      { status: error.status || 500 }
    );
  }
}
