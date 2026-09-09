"use client";
import React from "react";
import Banner from "../ourpolicies/components/Banner";
import mainImg from "../HomePage/Components/Images/GreenAndBlueFull2.webp";
import mainImg2 from "../gallery/images/genel/img-01.jpg";
import { Link } from '@/i18n/navigation';
import Image from "next/image";
import ExploreManavgat from "./components/ExploreManavgat";
import {useTranslations} from 'next-intl';
import IconSection from "./components/IconSection";

const REPORT_HREF = "/documents/SurdurulebilirlikRaporu2025-2026.pdf";

const Page = () => {
  const t = useTranslations('Footer');

const handleClick = (e) => {
  e.preventDefault();

  const href = e.currentTarget.href; // Türkçe yorum: tıklanan a etiketinin href'i

  if (window.confirm("Sunumu indirmek istediğinize emin misiniz?")) {
    window.open(href, "_blank", "noopener,noreferrer");
  }
};


  return (
    <div className="flex flex-col w-screen min-h-screen items-center justify-start overflow-x-hidden">
      <Banner img={mainImg2} span="" header={t("sustainability")} />
      <a
        href={REPORT_HREF}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center py-[10px] px-[20px] mt-10 text-[20px] cursor-pointer border-b hover:text-lagoBlack2 hover:border-lagoBlack2 hover:font-medium whitespace-nowrap font-jost"
      >
        Sürdürülebilirlik Raporu
      </a>
      <ExploreManavgat/>
      <IconSection/>
    </div>
  );
};

export default Page;
