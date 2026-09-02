import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PAGE_LOCALES } from "@/lib/pages/schema.mjs";
import {
  deletePageDraft,
  readPageDraft,
  setPagePublicationStatus,
  updatePageDraft,
} from "@/lib/admin/pages";
import { getAdminSession } from "@/lib/admin/session";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function GET(_request, { params }) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const page = await readPageDraft(id);

    if (!page) {
      return NextResponse.json({ error: "Sayfa taslağı bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfa taslağı alınamadı." },
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
    key: `admin-write:page-update:${getClientIp(request)}`,
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
    const { id } = await params;
    const { page } = await request.json();

    if (!page) {
      return NextResponse.json({ error: "Sayfa verisi zorunludur." }, { status: 400 });
    }

    const updatedPage = await updatePageDraft(id, page);
    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfa taslağı güncellenemedi." },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request, { params }) {
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
    key: `admin-write:page-publication:${getClientIp(request)}`,
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
    const { id } = await params;
    const { status } = await request.json();
    const previousPage = await readPageDraft(id);
    const page = await setPagePublicationStatus(id, status);

    PAGE_LOCALES.forEach((locale) => {
      const affectedSlugs = new Set([
        previousPage?.publishedSlugs?.[locale],
        page?.publishedSlugs?.[locale],
      ]);

      affectedSlugs.forEach((slug) => {
        if (slug) {
          revalidatePath(`/${locale}/${slug}`);
        }
      });

      revalidatePath(`/${locale}`, "layout");
    });

    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Sayfanın yayın durumu değiştirilemedi." },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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
    key: `admin-write:page-delete:${getClientIp(request)}`,
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Çok hızlı istek gönderildi. Lütfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const { id } = await params;
    const deletedPage = await deletePageDraft(id);

    PAGE_LOCALES.forEach((locale) => {
      const affectedSlugs = new Set([
        deletedPage.slugs?.[locale],
        deletedPage.publishedSlugs?.[locale],
      ]);

      affectedSlugs.forEach((slug) => {
        if (slug) {
          revalidatePath(`/${locale}/${slug}`);
        }
      });

      revalidatePath(`/${locale}`, "layout");
    });

    return NextResponse.json({ deletedPage });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Dinamik sayfa silinemedi." },
      { status: error.status || 500 }
    );
  }
}
