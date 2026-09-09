import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { createBlogPost, listBlogPosts } from "@/lib/admin/blog";
import { getAdminSession } from "@/lib/admin/session";
import { assertPanelPermission } from "@/lib/admin/authorization";
import { PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
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

  const posts = await listBlogPosts();
  return NextResponse.json({ posts });
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
    const { post } = await request.json();

    if (post?.status === "published") {
      assertPanelPermission(session, PANEL_PERMISSIONS.PUBLISH_CONTENT);
    }

    const savedPost = await createBlogPost(post);

    for (const locale of CMS_LOCALES) {
      revalidatePath(`/${locale}/news`);
      revalidatePath(`/${locale}/news/${savedPost.slug}`);
    }

    return NextResponse.json({ post: savedPost }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Blog yazısı oluşturulamadı." },
      { status: error.status || 500 }
    );
  }
}
