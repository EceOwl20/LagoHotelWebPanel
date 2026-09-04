"use client";
import React, { useState, useEffect, useCallback } from "react";
import useCarousel from "embla-carousel-react";
import Image from "next/image";
import {useTranslations} from 'next-intl';

const SpecialCarousel = ({ images }) => {
  const t = useTranslations('Special');

  const [emblaRef, emblaApi] = useCarousel({
    loop: true,
    align: "center",
    startIndex:1,
    containScroll: "trimSnaps", // Yanlardaki resimlerin taşmasını engeller
  });

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
    <div className="flex flex-col w-screen justify-center items-center text-center gap-[30px] lg:gap-[50px]">
      <div className="flex flex-col w-full justify-center items-center h-full max-h-[788px]">
        {/* Carousel */}
        <div className="overflow-hidden relative w-full" ref={emblaRef}>
          <div className="flex">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="flex-[0_0_auto] ml-[10px] lg:h-[788px]">
                <Image
                  src={image.src}
                  width={975}
                  height={789}
                  alt={image.alt || `Slide ${index + 1}`}
                  className="flex h-[45vh] w-auto object-cover object-center md:h-[60vh] lg:h-full"
                />
              </div>
            ))}  
          </div>

          <div className="bg-black/35 absolute inset-0"></div>
          <p className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[28px] md:text-[30px] lg:text-[48px] text-white font-marcellus font-normal leading-normal tracking-[0.48px] text-center w-[89.79%] md:w-[91.4%] lg:w-[25%]">
          {t("gallerytitle")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpecialCarousel;
