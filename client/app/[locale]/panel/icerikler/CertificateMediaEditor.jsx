"use client";

import SitePageMediaEditor from "./SitePageMediaEditor";

const singleImages = [
  { path: ["hero"], label: "Hero görseli" },
  { path: ["feature"], label: "Öne çıkan sertifika görseli" },
];

const collections = [
  {
    path: ["gallery"],
    label: "Sertifika carousel görselleri",
    itemLabel: "Carousel görseli",
  },
];

export default function CertificateMediaEditor({ activeLocale, hotel = "lago", ...editorProps }) {
  return (
    <SitePageMediaEditor
      pageKey="certificates"
      pageTitle="Certificates"
      uploadFolder="pages/certificates"
      singleImages={hotel === "azura" ? singleImages.map((field) => field.path[0] === "hero" ? { ...field, localizedAlt: false } : field) : singleImages}
      collections={hotel === "azura" ? collections.map((field) => ({ ...field, fixed: true })) : collections}
      activeLocale={activeLocale}
      localizedAlt={hotel === "azura"}
      {...editorProps}
    />
  );
}
