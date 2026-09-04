import BarCafeDetailPage from "../components/BarCafeDetailPage";

export default async function Page({ params }) {
  const { locale } = await params;

  return <BarCafeDetailPage locale={locale} pageKey="cafedelago" />;
}
