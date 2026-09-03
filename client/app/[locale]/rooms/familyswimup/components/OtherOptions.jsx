"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Link } from '@/i18n/navigation';
import { BiArea, BiGroup } from "react-icons/bi";
import {useTranslations} from 'next-intl';

function getImageProps(image, fallbackAlt) {
  return {
    src: image.src,
    alt: image.alt || fallbackAlt,
    width: image.width || 800,
    height: image.height || 600,
  };
}

const OtherOptions = ({ images, translationNamespace }) => {
  const t = useTranslations(translationNamespace);

  const rooms = [
    {
      id: 1,
      img: images.family,
      title: t("title1"),
      description: t("subtitle1"),
      size: t("m1"),
      capacity: t("capacity1"),
      text: t("text1"),
      link: "/rooms/familyroom",
    },
    {
      id: 2,
      img: images.swimup,
      title: t("title2"),
      description: t("subtitle2"),
      size: t("m2"),
      capacity: t("capacity2"),
      text: t("text2"),
      link: "/rooms/swimuproom",
    },
    {
      id: 3,
      img: images.superior,
      title: t("title3"),
      description: t("subtitle3"),
      size: t("m3"),
      capacity: t("capacity3"),
      text: t("text3"),
      link: "/rooms/superiorroom",
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

  const handleJump = useCallback((index) => {
    if (emblaApi && emblaApi.scrollTo) emblaApi.scrollTo(index);
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
    <div className="flex w-screen h-auto items-center justify-center max-w-[1440px]">
      <div className="flex flex-col w-[87.79%] md:w-[91.4%] lg:w-[76.8%] items-start justify-center gap-[30px] lg:gap-[50px] lg:min-w-[960px]">
        <div className="flex flex-col items-start justify-center w-full text-black gap-[15px] md:gap-[25px] lg:gap-[35px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.48px] leading-[14px] font-jost">
          {t("span")}
          </span>
          <h2 className="text-[28px] md:text-[36px] lg:text-[48px] font-marcellus font-normal leading-[120%] lg:leading-[57.6px] lg:capsizedText2">
          {t("title")}
          </h2>
        </div>

        {/* embla carousel */}
        <div className="overflow-hidden w-full" ref={emblaRef}>
          <div className="flex items-start justify-start w-full">
            {rooms.map((room) => {
              const image = getImageProps(room.img, room.title);

              return (
              <div
                key={room.id}
                className="flex-[0_0_85%] sm:flex-[0_0_75%] md:max-h-auto md:flex-[0_0_50%] lg:flex-[0_0_31%] xl:flex-[0_0_31.5%] min-w-0 mr-[2.5%]"
              >
                <div className="flex flex-col w-full items-start text-start justify-center gap-[15px] lg:gap-[20px] font-jost text-black ">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                  />
                  <span className="text-[12px] font-medium leading-[14px] tracking-[0.48px] uppercase">
                    {room.description}
                  </span>
                  <h3 className="text-[24px] lg:text-[30px] leading-[120%] lg:leading-[46.0059px] font-normal font-marcellus lg:capsizedText3">
                    {room.title}
                  </h3>
                  <div className="flex items-center justify-start text-center gap-[20px]">
                    <div className="flex items-center justify-center gap-[10px]">
                      <BiArea size={18}/>
                      <p className="text-lagoBrown text-[14px] lg:text-[16px] font-normal leading-normal">
                      {room.size}
                    </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-[10px]">
                     <BiGroup size={19} />
                     <p className="text-lagoBrown text-[14px] lg:text-[16px] font-normal leading-normal">
                     {room.capacity}
                    </p>
                    </div>
                    
                  </div>
                  <p className="text-[12px] lg:text-[14px] leading-[21px] font-normal capsizedText4 w-[96%] md:w-full line-clamp-4">
                    {room.text}
                  </p>
                  <Link
                    href={room.link}
                    className="flex text-lagoBrown leading-[30px] uppercase font-medium text-[12px] lg:text-[14px] px-[40px] py-[20px] border border-lagoBrown text-center justify-center items-center h-[41px]"
                  >
                  {t("buttonText")}
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="flex lg:hidden items-end justify-end w-full mt-[0px] md:mt-[20px] xl:mt-[50px] relative">
  {rooms.map((_, i) => (
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
  );
};

export default OtherOptions;
