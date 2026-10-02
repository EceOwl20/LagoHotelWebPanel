import { panelSiteAccessResponse, assertPanelPermission } from "@/lib/admin/authorization";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { deleteBlogPost, readBlogPost, saveBlogPost } from "@/lib/admin/blog";
import { getAdminSession } from "@/lib/admin/session";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import {
  assertBlogEditLock,
  assertBlogNotLockedByAnother,
  clearBlogEditLock,
} from "@/lib/admin/edit-locks";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function GET(_request, { params }) {
  const session = await getAdminSession();

  const siteDenied = panelSiteAccessResponse(session, "lago");
  if (siteDenied) return siteDenied;

  try {
    assertPanelPermission(
      session,
      PANEL_PERMISSIONS.EDIT_CONTENT
    );

    const { slug } = await params;
    const post = await readBlogPost(slug);

    if (!post) {
      return NextResponse.json(
        { error: "Blog yazısı bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Blog yazısı alınamadı." },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const session = await getAdminSession();
  const siteDenied = panelSiteAccessResponse(session, "lago");
  if (siteDenied) return siteDenied;

  try {
    assertPanelPermission(
      session,
      PANEL_PERMISSIONS.EDIT_CONTENT
    );

    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 403 }
    );
  }
  const rateLimit = consumeRateLimit({
    key: `admin-write:blog:${getClientIp(request)}`,
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
    const { slug } = await params;
    const { post, publicationStatus } = await request.json();
    const existingPost = await readBlogPost(slug);

    if (!existingPost) {
      return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });
    }

    assertBlogEditLock(
      slug,
      session,
      request.headers.get("x-panel-edit-lock")
    );

    if (publicationStatus !== undefined) {
      assertPanelPermission(session, PANEL_PERMISSIONS.PUBLISH_CONTENT);
    }

    const savedPost = await saveBlogPost(
      { ...post, slug },
      { publicationStatus }
    );

    if (publicationStatus !== undefined) {
      for (const locale of CMS_LOCALES) {
        revalidatePath(`/${locale}/news`);
        revalidatePath(`/${locale}/news/${savedPost.slug}`);
      }
    }

    return NextResponse.json({ post: savedPost });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Blog yazısı güncellenemedi." },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  const siteDenied = panelSiteAccessResponse(session, "lago");
  if (siteDenied) return siteDenied;

  try {
    assertPanelPermission(session, PANEL_PERMISSIONS.DELETE_CONTENT);
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:blog-delete:${getClientIp(request)}`,
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
    const { slug } = await params;
    const existingPost = await readBlogPost(slug);

    if (!existingPost) {
      return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });
    }

    assertBlogNotLockedByAnother(slug, session);
    const deletionResult = await deleteBlogPost(slug);
    clearBlogEditLock(slug);

    for (const locale of CMS_LOCALES) {
      revalidatePath(`/${locale}/news`);
      revalidatePath(`/${locale}/news/${slug}`);
    }

    return NextResponse.json({ success: true, ...deletionResult });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Blog yazısı silinemedi." },
      { status: error.status || 500 }
    );
  }
}
