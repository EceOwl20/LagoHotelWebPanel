import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  addGalleryImage,
  deleteGalleryImage,
  readGallery,
  reorderGalleryImages,
} from "@/lib/admin/gallery";
import { CMS_LOCALES, GALLERY_CATEGORY_ORDER } from "@/lib/admin/constants";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { assertGalleryCategoryEditLock } from "@/lib/admin/edit-locks";
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

export async function POST(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:gallery-add:${getClientIp(request)}`,
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Cok hizli istek gonderildi. Lutfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { categoryId, src } = await request.json();
    const resolvedCategoryId = GALLERY_CATEGORY_ORDER.includes(categoryId)
      ? categoryId
      : "other";
    assertGalleryCategoryEditLock(
      resolvedCategoryId,
      session,
      request.headers.get("x-panel-edit-lock")
    );
    const result = await addGalleryImage({ categoryId: resolvedCategoryId, src });

    for (const locale of CMS_LOCALES) {
      revalidatePath(`/${locale}/gallery`);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Görsel galeriye eklenemedi." },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.EDIT_CONTENT);
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

  try {
    const { categoryId, imageIds } = await request.json();

    if (!GALLERY_CATEGORY_ORDER.includes(categoryId)) {
      return NextResponse.json(
        { error: "Sıralanacak galeri kategorisi bulunamadı." },
        { status: 404 }
      );
    }

    assertGalleryCategoryEditLock(
      categoryId,
      session,
      request.headers.get("x-panel-edit-lock")
    );
    const gallery = await reorderGalleryImages({ categoryId, imageIds });

    for (const locale of CMS_LOCALES) {
      revalidatePath(`/${locale}/gallery`);
    }

    return NextResponse.json({ gallery });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Galeri sırası kaydedilemedi." },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
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

  if (!GALLERY_CATEGORY_ORDER.includes(categoryId)) {
    return NextResponse.json(
      { error: "Galeri kategorisi bulunamadı." },
      { status: 404 }
    );
  }

  let gallery;

  try {
    assertGalleryCategoryEditLock(
      categoryId,
      session,
      request.headers.get("x-panel-edit-lock")
    );
    gallery = await deleteGalleryImage(categoryId, imageId);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Görsel silinemedi.",
        usages: error.usages || [],
      },
      { status: error.status || 500 }
    );
  }

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}/gallery`);
  }

  return NextResponse.json({ gallery });
}
