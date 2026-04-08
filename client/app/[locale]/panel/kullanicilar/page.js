import { redirect } from "next/navigation";

export default async function LegacyUsersPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/panel/icerikler`);
}
