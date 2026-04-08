import { redirect } from "next/navigation";

export default async function PanelProfileRedirect({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/panel/dashboard`);
}
