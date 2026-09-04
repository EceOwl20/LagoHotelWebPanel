"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import {useTranslations} from 'next-intl';

const SpecialGridSection = ({ images }) => {
  const t = useTranslations('Special.HoverSection');

  // Kartları tutan dinamik veri dizisi
const gridData = [
  {
    title: t("title1"),
    span: t("subtitle1"),
    description:
    t("text1"),
    image: images.honeymoon,
  },
  {
    title: t("title2"),
    span: t("subtitle2"),
    description:
    t("text2"),
    image: images.pavilion,
  },
  {
    title: t("title3"),
    span: t("subtitle3"),
    description:
    t("text3"),
    image: images.proposal,
  },
  {
    title: t("title4"),
    span: t("subtitle4"),
    description:
    t("text4"),
    image: images.birthday,
  },
  // {
  //   title: t("title5"),
  //   span: t("subtitle5"),
  //   description:
  //   t("text5"),
  //   image: images.wedding,
  // },
  {
    title: t("title6"),
    span: t("subtitle6"),
    description:
    t("text6"),
    image: images.flowers,
  },
];

  const [emblaRef, emblaApi] = useEmblaCarousel({  loop: true,
    align: "start",
    startIndex: 0, });

  const [selectedIndex, setSelectedIndex] = useState(0);
    
  const scrollPrev = useCallback(() => {
    if (emblaApi && emblaApi.scrollPrev) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi && emblaApi.scrollNext) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      });
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  return (
    <div className="flex w-screen items-center justify-center ">
      <div className="flex flex-col w-[89.79%] md:w-[91.4%] lg:w-[84%] xl:w-[76.8%] items-center justify-center gap-[30px] lg:gap-[50px]">
        {/* Başlık Alanı */}
        <div className="flex flex-col w-full md:w-[70%] items-center justify-center text-center text-black font-jost gap-[15px] md:gap-[25px] lg:gap-[34px]">
          <span className="text-[12px] font-medium leading-[14px] tracking-[0.48px] uppercase">
          {t("subtitle")}
          </span>
          <h3 className="text-[28px] lg:text-[36px] font-normal font-marcellus capitalize leading-[120%] lg:leading-[57.6px] lg:capsizedText3">
          {t("title")}
          </h3>
          <p className="text-[14px] lg:text-[16px] font-normal leading-[24px] lg:capsizedText4 lg:max-w-[527px]">
          {t("text")}
          </p>
        </div>

        {/* Dinamik Grid Bölümü */}
        <div className="hidden md:grid md:grid-cols-3 gap-[27px] w-full xl:w-[1106px]">
          {gridData.map((item, index) => (
            <div
              key={index}
              role="img"
              aria-label={item.image.alt || item.title}
              className="flex flex-col w-[100%] items-start justify-end pb-[35px] h-[360px] lg:h-[44vh] xl:h-[500px] bg-center bg-cover relative group"
              style={{ backgroundImage: `url(${item.image.src})` }}
            >
              {/* Hafif karartma (her zaman görünür) */}
              <div className="absolute bg-black/10 inset-0 z-1"></div>

              {/* Normal başlık ve alt yazı (hover'da kaybolacak) */}
              <div className="flex flex-col ml-[32px] items-start justify-end z-10 gap-[20px] text-white">
                <span className="text-[12px] font-normal uppercase tracking-[0.48px] leading-[14px] transition-opacity duration-500 ease-in-out opacity-100 group-hover:opacity-0">
                  {item.span}
                </span>
                <h4 className="text-[26px] lg:text-[30px] leading-[120%] lg:leading-[57.6px] font-marcellus font-normal capitalize transition-opacity duration-500 ease-in-out opacity-100 group-hover:opacity-0 lg:capsizedText3">
                  {item.title}
                </h4>
              </div>

              {/* Tam karartma (hover ile açılacak) */}
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Hover ile aşağıdan kayan içerik */}
              <div
                className="absolute bottom-[52.28px] text-white flex flex-col justify-start items-center text-start font-montserrat gap-[20px] 
                opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out"
              >
                <div className="flex flex-col w-5/6 gap-[10px] items-start justify-center">
                  <span className="text-[12px] font-normal uppercase tracking-[0.48px] leading-[14px]">
                    {item.span}
                  </span>
                  <h4 className="text-[26px] lg:text-[30px] leading-[120%] lg:leading-[57.6px] font-marcellus font-normal capitalize lg:capsizedText3">
                    {item.title}
                  </h4>
                  <div className="flex w-full h-[1px] bg-grayLight"></div>
                  <p className="text-[11px]">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>


         {/* other options */}
      <div className="md:hidden flex flex-col gap-6 w-full">
        <div className="overflow-hidden w-full" ref={emblaRef}>
          <div className="flex items-start justify-start w-full">
            {gridData.map((data,index) => (
              <div
                key={index}
                className="flex-[0_0_auto] h-[390px] min-w-0 mr-[1.5%]"
              >
                <div className="flex flex-col relative w-full items-start text-start justify-center gap-[15px] lg:gap-[20px] font-jost text-black ">
                  <Image
                    src={data.image.src}
                    alt={data.image.alt || data.title}
                    width={700}
                    height={1000}
                     className="flex h-[383px] md:h-[400px] w-auto md:w-full"
                  />
                  <div className="absolute inset-0 bg-black/40 z-[1]"></div>
                  <div className="absolute bottom-[30px] left-[30px] text-white z-20">
                  <span className="text-[12px] font-normal uppercase tracking-[0.48px] leading-[14px]">
                    {data.span}
                  </span>
                  <h4 className="text-[26px] lg:text-[30px] leading-[120%] lg:leading-[57.6px] font-marcellus font-normal capitalize transition-opacity duration-500 ease-in-out opacity-100 group-hover:opacity-0 lg:capsizedText3">
                  {data.title}
                </h4>
                  </div>
                
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex lg:hidden items-end justify-end w-full mt-[0px] md:mt-[20px] xl:mt-[50px] relative">
  {gridData.map((_, i) => (
    <div
      key={i}
      className={`transition-all w-[33.3%] h-[1px] bg-[#24292C] rounded-full ${
        selectedIndex === i ? "p-[1px]" : "bg-[#848383] "
      }`}
      onClick={() => handleJump(i)}
    />
  ))}
</div>
        </div>

      </div>
    </div>
  );
};

export default SpecialGridSection;
