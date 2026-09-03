"use client";
import React, { useState, useEffect, useCallback } from "react";
import useCarousel from "embla-carousel-react";
import Image from "next/image";

function getImageProps(image, fallbackAlt) {
  return {
    src: image.src,
    alt: image.alt || fallbackAlt,
    width: image.width || 1600,
    height: image.height || 1067,
  };
}

const KidsMomentCarousel = ({ images, header,showheader }) => {
  const [emblaRef, emblaApi] = useCarousel({
    loop: true,
    align: "center",
    startIndex: 0,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Önceki ve sonraki kaydırma fonksiyonları
  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    // Başlangıçta seçili index'i ayarla
    setSelectedIndex(emblaApi.selectedScrollSnap());

    // Cleanup
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  return (
    <div className="flex flex-col w-screen justify-center items-center text-center gap-[30px] lg:gap-[50px]">
      {showheader && (
        <h2 className="text-[28px] md:text-[32px] lg:text-[48px] text-black font-marcellus font-normal leading-[48px]">
        {header}
      </h2>
      )}

      <div className="flex w-full justify-center items-center h-full">
        <div
          className="flex overflow-hidden relative w-full flex-col justify-center items-center"
          ref={emblaRef}
        >
          <div className="flex grid-flow-col">
            {images.map((img, index) => {
              const image = getImageProps(img, `Slide ${index + 1}`);

              return (
              <div
                key={img.id || `${image.src}-${index}`}
                className="flex-[0_0_85%] sm:flex-[0_0_auto] min-w-0 ml-[2%] md:ml-[10px] lg:h-[600px]"
              >
                <Image
                  src={image.src}
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                  className="flex h-[35vh] lg:h-full md:min-h-[420px] md:h-[38vh] w-auto"
                />
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsMomentCarousel;
