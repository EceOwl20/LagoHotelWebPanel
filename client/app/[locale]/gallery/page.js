import React from "react";
import MainBanner2 from "../GeneralComponents/MainBanner2";
import mainImg from "./images/maingallery.webp";
import GalleryScrollSection from "./components/GalleryScrollSection";
import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";
import { getTranslations } from "next-intl/server";
import { readGallery } from "@/lib/admin/gallery";

const Page = async () => {
  const t = await getTranslations("Gallery");
  const gallery = await readGallery();

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden gap-[100px] bg-[#fbfbfb]">
      <div className="flex flex-col items-center justify-center">
        <MainBanner2 img={mainImg} header={t("subtitle")} />
        <GalleryScrollSection categories={gallery.categories} />
      </div>
      <ContactSection2 />
    </div>
  );
};

export default Page;
