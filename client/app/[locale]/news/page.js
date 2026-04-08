import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";
import MainBanner2 from "../GeneralComponents/MainBanner2";
import mainImg from "./images/mainfoto.webp";
import { listBlogPosts } from "@/lib/admin/blog";

function pickTranslation(post, locale) {
  return (
    post.translations?.[locale] ||
    post.translations?.tr ||
    post.translations?.en ||
    post.translations?.de ||
    post.translations?.ru
  );
}

export default async function NewsPage({ params }) {
  const { locale } = await params;
  const t = await getTranslations("BlogNews");
  const posts = (await listBlogPosts()).filter((post) => post.status === "published");

  return (
    <div className="flex flex-col items-center justify-center gap-[50px] bg-[#fbfbfb] lg:gap-[100px]">
      <MainBanner2 img={mainImg} span={t("subtitle")} header={t("title")} />

      <section className="w-full max-w-[1240px] px-4 md:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-500">
            Lago Journal
          </p>
          <h1 className="mt-3 text-4xl font-medium text-stone-900">
            {t("title")}
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Panelden eklenen blog yazilari burada listelenir. Her yazi 4 dil icin
            ayri icerik alanlariyla yonetilir.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const translation = pickTranslation(post, locale);

              return (
                <article
                  key={post.slug}
                  className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm"
                >
                  <Link
                    href={{ pathname: "/news/[slug]", params: { slug: post.slug } }}
                    className="block"
                  >
                    <div className="relative h-64 w-full overflow-hidden">
                      <Image
                        src={post.coverImage || mainImg}
                        alt={translation.title}
                        fill
                        className="object-cover transition duration-500 hover:scale-105"
                        unoptimized={typeof post.coverImage === "string"}
                      />
                    </div>
                  </Link>

                  <div className="space-y-4 p-6">
                    <div className="text-xs uppercase tracking-[0.25em] text-stone-500">
                      {new Date(post.publishedAt).toLocaleDateString(locale)}
                    </div>
                    <h2 className="text-2xl font-medium text-stone-900">
                      <Link
                        href={{ pathname: "/news/[slug]", params: { slug: post.slug } }}
                      >
                        {translation.title}
                      </Link>
                    </h2>
                    <p className="line-clamp-4 text-sm leading-7 text-stone-600">
                      {translation.excerpt}
                    </p>
                    <Link
                      href={{ pathname: "/news/[slug]", params: { slug: post.slug } }}
                      className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-900 hover:text-white"
                    >
                      Yaziyi Ac
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white px-6 py-10 text-sm text-stone-500">
            Henuz yayinlanmis blog yazisi bulunmuyor.
          </div>
        )}
      </section>

      <ContactSection2 />
    </div>
  );
}
