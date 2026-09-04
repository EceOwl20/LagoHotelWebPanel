"use client";
import React, { useState, useEffect, useCallback } from "react";
import useCarousel from "embla-carousel-react";
import Image from 'next/image'
import L2Svg from './L2Svg'
import A2Svg from './A2Svg'
import G2Svg from './G2Svg'
import O2Svg from './O2Svg'
import {useTranslations} from 'next-intl';

const ActivityBackgroundSection = ({ images }) => {
  const t = useTranslations('Entertainment.Gallery');

  const [emblaRef, emblaApi] = useCarousel({
    loop: true,
    align: "start",
    startIndex: 0,
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
    <div className='flex flex-col w-screen items-center justify-center gap-[30px] lg:gap-[50px] ' >
      <div className='flex flex-col w-[87.79%] md:w-[91.4%] lg:w-[65%] items-center justify-center text-center font-jost text-black gap-[15px] md:gap-[25px] lg:gap-[35px] xl:max-w-[1440px]'>
      <span className='text-[12px] leading-[14px] font-medium uppercase tracking-[0.48px]'>{t("subtitle")}</span>
            <h2 className='text-[28px] md:text-[32px] lg:text-[48px] leading-normal lg:leading-[57.6px] font-normal font-marcellus capsizedText2'>{t("title")}</h2>
            <p className='text-[14px] lg:text-[16px] font-normal leading-normal lg:leading-[24px] lg:w-[43%] lg:min-w-[608px]'>{t("text")} </p>
      </div>

       <div className="flex flex-col w-full justify-center items-center  lg:min-h-[650px] ">
        {/* carousel */}
        <div
          className="flex overflow-hidden relative w-full flex-col justify-center items-center "
          ref={emblaRef}
        >
          <div className="flex grid-flow-col w-full space-x-0 bg-black">
            {images.map((image, index) => (
              <div
                className="flex-[0_0_auto] min-w-0 lg:h-[650px] -mx-[2px]"
                key={index}
              >
                <Image
                  src={image.src}
                  width={image.width || 1600}
                  height={image.height || 1067}
                  alt={image.alt || `Slide ${index + 1}`}
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  className="flex h-full w-auto"
                />
                 
              </div>
            ))}
           
          </div>
          <div className='absolute left-1/2 -translate-x-1/2 items-center justify-between hidden lg:flex w-[1440px] z-30'>
                <L2Svg className="flex z-50" width={227} height={645} />
                <A2Svg className="flex" width={341} height={645}/>
                <G2Svg className="flex" width={285} height={645}/>
                <O2Svg className="flex" width={299} height={645}/>
                
            </div>

            <div className='absolute left-1/2 -translate-x-1/2 items-center justify-between lg:hidden flex w-full z-30'>
                <L2Svg className="flex z-50" width={113.5} height={322} />
                <A2Svg className="flex" width={170.5} height={322}/>
                <G2Svg className="flex" width={142.5} height={322}/>
                <O2Svg className="flex" width={149.5} height={322}/>
                
            </div>
        </div>
      </div>
      <div className='flex w-[87.79%] md:w-[91.4%] lg:w-[42%] items-center text-center justify-center -mt-[25px]'>
          <span className='text-[12px] lg:text-[14px] font-jost text-lagoGray font-normal leading-normal lg:w-[43%] lg:min-w-[608px]'>*{t("span")}</span>
        </div>
    </div>
  )
}

export default ActivityBackgroundSection
