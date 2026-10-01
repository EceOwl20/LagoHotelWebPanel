import BlogManager from "../../blog/BlogManager";
import { getAzuraBlogVersion } from "@/lib/admin/azura-blog-version.mjs";
export const dynamic = "force-dynamic";
export default function AzuraBlogPage() {
  return <BlogManager key="azura" hotel="azura" azuraContractVersion={getAzuraBlogVersion()} />;
}
