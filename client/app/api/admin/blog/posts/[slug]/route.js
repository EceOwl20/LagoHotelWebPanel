import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { deleteBlogPost, readBlogPost, saveBlogPost } from "@/lib/admin/blog";
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

  const { slug } = await params;
  const post = await readBlogPost(slug);

  if (!post) {
    return NextResponse.json({ error: "Blog yazısı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ post });
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

  const { slug } = await params;
  const { post } = await request.json();

  const savedPost = await saveBlogPost({ ...post, slug });

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/news/${savedPost.slug}`);
  }

  return NextResponse.json({ post: savedPost });
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

  const { slug } = await params;
  const deletionResult = await deleteBlogPost(slug);

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/news/${slug}`);
  }

  return NextResponse.json({ success: true, ...deletionResult });
}
