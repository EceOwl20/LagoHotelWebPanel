"use client"; // Next.js App Router'da useState için gerekli
import { Link } from '@/i18n/navigation';
import React, { useState } from "react";
import {useTranslations} from 'next-intl';

const SpecialTypesSection = ({ images }) => {
  const t = useTranslations('Special.InfoSection');
  const concepts = {
    [t("key1")]: {
      title: t("title1"),
      description:
      t("text1"),
      image: images.honeymoon,
    },
    [t("key2")]: {
      title: t("title2"),
      description:
      t("text2"),
      image: images.proposal,
    },
    // [t("key5")]: {
    //   title: t("title5"),
    //   description:
    //   t("text5"),
    //   image: images.wedding,
    // },
    [t("key4")]: {
      title: t("title4"),
      description:
      t("text4"),
      image: images.birthday,
    },
    [t("key3")]: {
      title: t("title3"),
      description:
      t("text3"),
      image: images.pavilion,
    },
    [t("key6")]: {
      title: t("title6"),
      description:
      t("text6"),
      image: images.flowers,
    },
  };

  const conceptKeys = Object.keys(concepts);
  const [selectedConcept, setSelectedConcept] = useState(concepts[conceptKeys[0]]);
  

  return (
    <div className="flex flex-col w-screen items-center justify-center gap-[30px] lg:gap-[50px]">
      {/* Başlık Alanı */}
      <div className="flex flex-col items-center justify-center text-center w-[89.79%%] md:w-[91.4%] lg:w-[76.8%] gap-[15px] md:gap-[25px] lg:gap-[35px]">
        <span className="text-[12px] font-medium leading-[14px] tracking-[0.48px] uppercase font-jost">
          {t("title")}
        </span>
        <h3 className="text-[28px] md:text-[32px] lg:text-[48px] font-normal leading-[120%] lg:leading-[57.6px] text-lagoBlack lg:capsizedText2 font-marcellus capitalize">
        {t("subtitle")}
        </h3>
        <p className="text-[14px] lg:text-[16px] font-normal leading-[24px] w-[90%] md:w-[55%] lg:w-[598px] lg:capsizedText4 font-jost">
        {t("text")}
        </p>
      </div>

      <div className="flex flex-col w-full">
        {/* Linkler */}
        <div className="flex w-full justify-center items-center bg-[#EDEDED] max-h-[105px]">
          <div className="flex w-[90%] md:w-[80%] justify-between items-center py-[42px] gap-[15px] md:gap-[43px] text-black font-marcellus text-[14px] md:text-[20px] lg:text-[28px] font-normal leading-[120%] lg:leading-[57.6px] overflow-x-scroll">
            {Object.keys(concepts).map((concept) => (
              <button
                key={concept}
                className={`hover:underline ${
                  selectedConcept.title === concept ? "text-gray-700 font-bold" : "text-black"
                }`}
                onClick={() => setSelectedConcept(concepts[concept])}
              >
                {concept}
              </button>
            ))}
          </div>
        </div>

        {/* Dinamik İçerik */}
        <div
          role="img"
          aria-label={selectedConcept.image.alt || selectedConcept.title}
          className="flex w-screen h-[51vh] 2xl:h-[53vh] items-end justify-end bg-cover bg-center transition-all duration-500"
          style={{ backgroundImage: `url(${selectedConcept.image.src})` }}
        >
          <div className="flex h-full w-full md:w-[45%] items-center justify-center bg-[#2D2D26]/50">
            <div className="flex flex-col items-start justify-center w-[89.79%] ml-[6.1%] md:w-[80%] gap-[35px] text-white font-jost text-start">
              <span className="text-[12px] font-medium leading-[14px] tracking-[0.48px] uppercase">{t("subtitle")}</span>
              <h2 className="text-[26px] capitalize lg:text-[30px] md:text-[44px] font-marcellus font-normal leading-[120%] lg:leading-[57.6px] lg:capsizedText2">{selectedConcept.title}</h2>
              <p className="text-[14px] lg:text-[16px] font-normal leading-[24px] w-[90%] md:w-[80%] 2xl:w-[73%] lg:capsizedText4 lg:min-w-[443px]">{selectedConcept.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialTypesSection;
