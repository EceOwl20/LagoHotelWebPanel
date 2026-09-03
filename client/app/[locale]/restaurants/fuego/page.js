import RestaurantDetailPage from "../components/RestaurantDetailPage";

export default async function Page({ params }) {
  const { locale } = await params;

  return <RestaurantDetailPage locale={locale} pageKey="fuego" />;
}
