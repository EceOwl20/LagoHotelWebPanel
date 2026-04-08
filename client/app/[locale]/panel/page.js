import { redirect } from "next/navigation";

export default async function PanelPage({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/panel/dashboard`);
}
