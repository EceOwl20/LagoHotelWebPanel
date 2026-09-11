import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { PAGE_LOCALES } from "@/lib/pages/schema.mjs";
import {
  deletePageDraft,
  readPageDraft,
  savePageDraft,
  setPagePublicationStatus,
} from "@/lib/admin/pages";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  assertPageEditLock,
  assertPageNotLockedByAnother,
  clearPageEditLock,
} from "@/lib/admin/edit-locks";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

function revalidatePublishedPagePaths(previousSlugs, nextSlugs) {
  PAGE_LOCALES.forEach((locale) => {
    const affectedSlugs = new Set([
      previousSlugs?.[locale],
      nextSlugs?.[locale],
    ]);

    affectedSlugs.forEach((slug) => {
      if (slug) {
        revalidatePath(`/${locale}/${slug}`);
      }
    });

    revalidatePath(`/${locale}`, "layout");
  });
}

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

  let requestBody;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçerli bir JSON gövdesi gönderin." },
      { status: 400 }
    );
  }

  const { page, publicationStatus } = requestBody;
  const changesPublicationStatus = publicationStatus !== undefined;

  if (changesPublicationStatus) {
    try {
      assertPanelPermission(session, PANEL_PERMISSIONS.PUBLISH_CONTENT);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 403 }
      );
    }
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:${
      changesPublicationStatus ? "page-publication" : "page-update"
    }:${getClientIp(request)}`,
    limit: changesPublicationStatus ? 30 : 60,
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

    if (!page) {
      return NextResponse.json({ error: "Sayfa verisi zorunludur." }, { status: 400 });
    }

    assertPageEditLock(id, session, request.headers.get("x-panel-edit-lock"));
    const result = await savePageDraft(id, page, {
      publicationStatus,
      updatedBy: {
        id: session.userId,
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      },
    });

    if (changesPublicationStatus) {
      revalidatePublishedPagePaths(
        result.previousPublishedSlugs,
        result.page.publishedSlugs
      );
    }

    return NextResponse.json({ page: result.page });
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
    assertPanelPermission(session, PANEL_PERMISSIONS.PUBLISH_CONTENT);
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
    assertPageEditLock(id, session, request.headers.get("x-panel-edit-lock"));
    const previousPage = await readPageDraft(id);
    const page = await setPagePublicationStatus(id, status);

    revalidatePublishedPagePaths(
      previousPage?.publishedSlugs,
      page?.publishedSlugs
    );

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
    assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
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
    assertPageNotLockedByAnother(id, session);
    const deletedPage = await deletePageDraft(id, {
      deletedBy: {
        id: session.userId,
        username: session.username,
        displayName: session.displayName,
        role: session.role,
      },
    });
    clearPageEditLock(id);

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
      { error: error.message || "Dinamik sayfa çöp kutusuna taşınamadı." },
      { status: error.status || 500 }
    );
  }
}
