"use client";
import React, { useState, useEffect, useCallback } from "react";
import useCarousel from "embla-carousel-react";
import { Link } from '@/i18n/navigation';
import Image from "next/image";
import { useTranslations } from "next-intl";

// Single slide component
const Slide = ({ slide, index }) => (
  <div className="flex-[0_0_90%] md:flex-[0_0_79%] lg:flex-[0_0_85%] xl:flex-[0_0_auto] min-w-0 mr-[1.8%]">
    <Image
      src={slide.src}
      alt={slide.alt || `Slide ${index + 1}`}
      width={slide.width || 1200}
      height={slide.height || 800}
      style={{ objectPosition: "center" }}
      className="flex h-full w-full object-cover"
    />
  </div>
);

const BarCarouselSection = ({ images = [] }) => {
  const t = useTranslations("BarAndCafes.BarCarousel");

  const [emblaRef, emblaApi] = useCarousel({
    loop: true,
    align: "start",
    startIndex: 0,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    setSelectedIndex(emblaApi.selectedScrollSnap());
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  return (
    <div className="flex flex-col md:flex-row w-screen h-auto items-center justify-center md:justify-between gap-[30px] lg:gap-0">
      {/* Text Column */}
      <div className="flex items-end justify-end w-[87.79%] md:ml-[4.3%] lg:ml-0  md:w-[46%] lg:w-[49%]">
        <div className="flex flex-col items-start justify-center max-w-[520px] gap-[15px] md:gap-[25px] lg:gap-[35px] text-black font-jost">
          <span className="text-[12px] font-medium leading-normal uppercase tracking-[0.48px]">
            {t("subtitle")}
          </span>
          <h2 className="text-[28px] md:text-[32px] lg:text-[48px] font-marcellus font-normal leading-[120%] lg:leading-[57.6px] lg:capsizedText2">
            {t("title")}
          </h2>
          <div className="text-[14px] font-normal leading-[130%] lg:leading-normal md:w-[92%] lg:capsizedText4">
            {t("text")} <br/>
             Snack Restaurants;
            <ul className="mt-2 list-disc pl-4 marker:text-xs marker:text-black">
            <li>Snack spot 11.00-18.00</li>
            <li>Tiny bites 11.00-16.00</li>
          </ul>
          </div>
         
          <Link
            href="/"
            className="flex border border-lagoBrown py-[14px] lg:px-[28px] lg:h-[41px] h-[39px] px-[18px] min-w-[124px] lg:min-w-[144px] whitespace-nowrap shadow-buttonCustom justify-center items-center text-center text-[14px] text-lagoBrown font-medium uppercase leading-[30px] bg-[#fbfbfb]"
          >
            {t("buttonText")}
          </Link>
        </div>
      </div>

      {/* Carousel Column */}
      <div className="flex flex-col w-[87.79%] md:w-[50%] md:justify-end md:items-end h-auto md:h-[35vh] lg:h-[45vh] xl:h-[40vh] overflow-y-auto xl:min-h-[434px]">
        <div
          className="flex overflow-hidden relative w-full h-full flex-col justify-end items-end"
          ref={emblaRef}
        >
          <div className="flex grid-flow-col  h-full md:w-[50vw] ">
            {images.map((img, index) => (
              <Slide key={img.id || `${img.src}-${index}`} slide={img} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarCarouselSection;
