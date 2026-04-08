import { redirect } from "next/navigation";

export default async function LegacyNewUserPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/panel/blog`);
}
