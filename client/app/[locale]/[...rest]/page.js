import { notFound } from "next/navigation";
import { getLocalizedContent } from "@/lib/pages/schema.mjs";
import { readPublishedPageBySlug } from "@/lib/admin/pages";
import StandardPageTemplate from "../_page-template/StandardPageTemplate";

async function getDynamicPage(params) {
  const { locale, rest } = await params;

  if (!Array.isArray(rest) || rest.length !== 1) {
    return null;
  }

  return readPublishedPageBySlug(locale, rest[0]);
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const page = await getDynamicPage(params);

  if (!page) {
    return {};
  }

  const seo = getLocalizedContent(page.seo, locale);
  const hero = getLocalizedContent(page.hero?.translations, locale);

  return {
    title: seo.title || hero.title || "Lago Hotel",
    description: seo.description || undefined,
  };
}

export default async function CatchAllPage({ params }) {
  const { locale } = await params;
  const page = await getDynamicPage(params);

  if (!page) {
    notFound();
  }

  return <StandardPageTemplate page={page} locale={locale} />;
}
