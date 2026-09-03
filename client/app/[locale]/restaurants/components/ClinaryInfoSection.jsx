"use client";
import React, { useEffect, useState, useRef } from "react";
import defaultImg1 from "../images/art1.webp";
import defaultImg2 from "../images/art2.webp";
import Image from "next/image";

function getImageProps(image, fallbackAlt) {
  return {
    src: image.src,
    alt: image.alt || fallbackAlt,
    width: image.width || 800,
    height: image.height || 1200,
  };
}

const ClinaryInfoSection = ({
  img1 = defaultImg1,
  img2 = defaultImg2,
  span,
  header,
  texts = [],
}) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const imgClasses =
    "w-[175px] h-[260px] md:w-[186.60px] md:h-[279.91px] lg:w-[300px] lg:h-[450px] transition-all duration-1000 ease-in-out";
  const firstImage = getImageProps(img1, "Mutfak sunum görseli");
  const secondImage = getImageProps(img2, "Mutfak sunum görseli");

  return (
    <div
      ref={ref}
      className="flex w-screen md:h-[40vh] lg:h-[555px] items-center justify-center relative max-w-[1440px]"
    >
      <div className="flex flex-col md:flex-row w-[87.79%] md:w-[91.4%] xl:w-[76.8%] items-center justify-center gap-[30px] md:gap-[36.83px] lg:gap-[52px] h-full">
        {/* Text Section */}
        <div className="flex flex-col w-[90%] md:w-[49%] items-center md:items-start justify-center text-center md:text-start gap-[15px] md:gap-[25px] lg:gap-[35px] text-black font-jost">
          {span && (
            <span className="text-[12.002px] font-medium leading-[14.026px] tracking-[0.481px] uppercase">
              {span}
            </span>
          )}
          {header && (
            <h2 className="text-[28px] md:text-[32px] lg:text-[48.089px] font-normal font-marcellus leading-[120%] lg:leading-[57.707px] lg:capsizedText2">
              {header}
            </h2>
          )}
          {texts[0] && (
            <p className="text-[14px] lg:text-[16.03px] font-normal leading-[24.045px] leading-trim-both text-edge-cap lg:capsizedText4">
              {texts[0]}
            </p>
          )}
          <div className="flex flex-col gap-[15px] md:gap-[25px] lg:gap-[35px]">
            {texts.length < 3 && texts[1] && (
              <p className="text-[14px] lg:text-[16.03px] font-normal leading-[24.045px] leading-trim-both text-edge-cap">
                {texts[1]}
              </p>
            )}
            {texts.length >= 3 && (
              <ul className="hidden md:flex md:flex-col text-[14px] lg:text-[16.03px] font-normal leading-[24.045px] lg:leading-[24.045px] list-disc pl-5 marker:text-xs marker:text-black">
                {texts.slice(1).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Images Section */}
        <div className="flex w-[65%] sm:w-[50%] min-w-[310px] md:w-[48.8%] items-center justify-start relative md:h-[555px] h-auto mb-[60px]">
          <Image
            src={secondImage.src}
            alt={secondImage.alt}
            width={secondImage.width}
            height={secondImage.height}
            className={`${imgClasses} mb-[20px] lg:mb-0 ${
              visible ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"
            }`}
          />
          <Image
            src={firstImage.src}
            alt={firstImage.alt}
            width={firstImage.width}
            height={firstImage.height}
            className={`absolute top-[80px] left-[126px] md:top-[208px] md:left-[135px] lg:top-[105px] lg:left-[215px] ${imgClasses} ${
              visible ? "-translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default ClinaryInfoSection;
