import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { listBlogPosts, saveBlogPost } from "@/lib/admin/blog";
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

  const { post } = await request.json();

  if (!post) {
    return NextResponse.json({ error: "Post verisi zorunludur." }, { status: 400 });
  }

  const savedPost = await saveBlogPost(post);

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}/news`);
    revalidatePath(`/${locale}/news/${savedPost.slug}`);
  }

  return NextResponse.json({ post: savedPost });
}
