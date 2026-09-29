import PageBuilder from "../../../sayfalar/yeni/PageBuilder";
export default async function AzuraPageEditor({ params }) {
  const { id } = await params;
  return <PageBuilder key={`azura-${id}`} hotel="azura" />;
}
