import { NextResponse } from "next/server";
import { PAGE_LOCALES } from "@/lib/pages/schema.mjs";
import { readPublishedPageBySlug } from "@/lib/admin/pages";

export async function GET(request) {
  const locale = request.nextUrl.searchParams.get("locale");
  const slug = request.nextUrl.searchParams.get("slug");

  if (!PAGE_LOCALES.includes(locale) || !slug || slug.length > 200) {
    return NextResponse.json({ error: "Geçersiz sayfa adresi." }, { status: 400 });
  }

  const page = await readPublishedPageBySlug(locale, slug);

  if (!page) {
    return NextResponse.json({ routes: null });
  }

  const routes = Object.fromEntries(
    PAGE_LOCALES.map((targetLocale) => [
      targetLocale,
      page.slugs?.[targetLocale]
        ? `/${targetLocale}/${page.slugs[targetLocale]}`
        : null,
    ])
  );

  return NextResponse.json(
    { routes },
    { headers: { "Cache-Control": "no-store" } }
  );
}
