"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const imageSections = [
  {
    id: "social-gallery",
    title: "Kayan galeri alanı",
    description: "Bu ortak component'ın kullanıldığı bütün sayfalarda aynı kolaj gösterilir.",
    fields: [{ path: ["socialGallery"], label: "Kayan galeri kolajı" }],
  },
];

export default function ContactSection2MediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="contactsection2"
      pageTitle="İletişim Alanı 2"
      activeLocale={activeLocale}
      uploadFolder="pages/contactsection2"
      singleImages={[]}
      imageSections={imageSections}
      collections={[]}
      localizedAlt
    />
  );
}
