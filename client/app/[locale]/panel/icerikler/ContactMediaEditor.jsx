"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const imageSections = [
  {
    id: "hero",
    title: "İletişim üst alanı",
    description: "İletişim başlığı ve iletişim bilgilerinin üzerinde gösterilen kapak görseli.",
    fields: [{ path: ["hero"], label: "Hero görseli" }],
  },
  {
    id: "contact-form",
    title: "İletişim formu",
    description: "İletişim formunun arkasında geniş olarak gösterilen fotoğraf.",
    fields: [{ path: ["formBackground"], label: "Form arka plan görseli" }],
  },
];

export default function ContactMediaEditor({ activeLocale }) {
  return (
    <SitePageMediaEditor
      pageKey="contact"
      pageTitle="İletişim"
      activeLocale={activeLocale}
      uploadFolder="pages/contact"
      singleImages={[]}
      imageSections={imageSections}
      collections={[]}
      localizedAlt
    />
  );
}
