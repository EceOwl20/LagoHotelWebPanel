import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteGalleryImage, readGallery, writeGallery } from "@/lib/admin/gallery";
import { CMS_LOCALES } from "@/lib/admin/constants";
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

  const gallery = await readGallery();
  return NextResponse.json({ gallery });
}

export async function PUT(request) {
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
    key: `admin-write:gallery:${getClientIp(request)}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Cok hizli istek gonderildi. Lutfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { gallery } = await request.json();

  if (!gallery) {
    return NextResponse.json({ error: "Galeri verisi zorunludur." }, { status: 400 });
  }

  const saved = await writeGallery(gallery);

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}/gallery`);
  }

  return NextResponse.json({ gallery: saved });
}

export async function DELETE(request) {
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
    key: `admin-write:gallery-delete:${getClientIp(request)}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Cok hizli istek gonderildi. Lutfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const categoryId = request.nextUrl.searchParams.get("categoryId");
  const imageId = request.nextUrl.searchParams.get("imageId");

  if (!categoryId || !imageId) {
    return NextResponse.json(
      { error: "categoryId ve imageId zorunludur." },
      { status: 400 }
    );
  }

  const gallery = await deleteGalleryImage(categoryId, imageId);

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}/gallery`);
  }

  return NextResponse.json({ gallery });
}
