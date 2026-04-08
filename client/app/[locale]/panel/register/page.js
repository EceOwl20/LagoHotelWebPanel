import { redirect } from "next/navigation";

export default async function PanelRegisterRedirect({ params }) {
  const { locale } = await params;
  redirect(`/${locale}/panel/dashboard`);
}
