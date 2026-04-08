import Image from "next/image";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { readBlogPost } from "@/lib/admin/blog";

function pickTranslation(post, locale) {
  return (
    post.translations?.[locale] ||
    post.translations?.tr ||
    post.translations?.en ||
    post.translations?.de ||
    post.translations?.ru
  );
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const post = await readBlogPost(slug);

  if (!post || post.status !== "published") {
    return {};
  }

  const translation = pickTranslation(post, locale);

  return {
    title: translation.seoTitle || translation.title,
    description: translation.seoDescription || translation.excerpt,
  };
}

export default async function NewsDetailPage({ params }) {
  const { locale, slug } = await params;
  const post = await readBlogPost(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const translation = pickTranslation(post, locale);
  const paragraphs = translation.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="bg-[#fbfbfb] pb-20">
      <article className="mx-auto max-w-[1100px] px-4 pt-32 md:px-8">
        <Link
          href="/news"
          className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-900 hover:text-white"
        >
          Tum blog yazilari
        </Link>

        <div className="mt-8 overflow-hidden rounded-[32px] border border-stone-200 bg-white shadow-sm">
          <div className="relative h-[320px] w-full md:h-[520px]">
            <Image
              src={post.coverImage}
              alt={translation.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="space-y-6 p-6 md:p-10">
            <div className="text-xs uppercase tracking-[0.25em] text-stone-500">
              {new Date(post.publishedAt).toLocaleDateString(locale)}
            </div>
            <h1 className="text-4xl font-medium leading-tight text-stone-900 md:text-5xl">
              {translation.title}
            </h1>
            <p className="text-lg leading-8 text-stone-600">{translation.excerpt}</p>

            <div className="h-px w-full bg-stone-200" />

            <div className="space-y-5 text-base leading-8 text-stone-700">
              {paragraphs.map((paragraph, index) => (
                <p key={`${post.slug}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
