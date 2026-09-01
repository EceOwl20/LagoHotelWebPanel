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

export default function CertificateMediaEditor() {
  return (
    <SitePageMediaEditor
      pageKey="certificates"
      pageTitle="Certificates"
      uploadFolder="pages/certificates"
      singleImages={singleImages}
      collections={collections}
    />
  );
}
