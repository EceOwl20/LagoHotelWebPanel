import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin/session";
import {
  readSitePageContent,
  writeSitePageContent,
} from "@/lib/admin/site-pages";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

const CERTIFICATE_PATHS = [
  "/tr/sertifikalar",
  "/en/certificates",
  "/de/zertifikate",
  "/ru/sertifikaty",
];

const SPA_WELLNESS_PATHS = ["tr", "en", "de", "ru"].map(
  (locale) => `/${locale}/spawellness`
);

export async function GET(_request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const { pageKey } = await params;
    const content = await readSitePageContent(pageKey);
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfa görselleri alınamadı." },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request, { params }) {
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
    key: `admin-write:site-page:${getClientIp(request)}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı istek gönderildi. Lütfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { pageKey } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== "object") {
      return NextResponse.json({ error: "Sayfa görsel verisi zorunludur." }, { status: 400 });
    }

    const saved = await writeSitePageContent(pageKey, content);

    if (pageKey === "certificates") {
      CERTIFICATE_PATHS.forEach((pagePath) => revalidatePath(pagePath));
    }

    if (pageKey === "spawellness") {
      SPA_WELLNESS_PATHS.forEach((pagePath) => revalidatePath(pagePath));
    }

    return NextResponse.json({ content: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfa görselleri kaydedilemedi." },
      { status: error.status || 500 }
    );
  }
}
