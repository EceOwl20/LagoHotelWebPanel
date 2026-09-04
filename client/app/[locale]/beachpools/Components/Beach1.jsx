"use client";

import React, { useState, useEffect, useRef } from "react";
import {useTranslations} from 'next-intl';
import { Link } from '@/i18n/navigation';
import BeachClinary from "./BeachClinary";

export default function Beach1({ media }) {
  const t = useTranslations('BeachPools');
  const t2 = useTranslations('BeachPools.ClinaryInfoSection');
  const [scrollAttempt, setScrollAttempt] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  const texts = [
    t2("text1"),
    t2("text2"),
    t2("text3"),
    t2("text4"),
    t2("text5")
  ];


  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (scrollAttempt === 0) {
        e.preventDefault();
        if (!animate) {
          setAnimate(true);
          setTimeout(() => {
            setScrollAttempt(1);
            setTextVisible(true);
          }, 700);
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scrollAttempt, animate]);

  // Yazı animasyonu: Kaydırma sırasında yukarı kayarak kayboluyor.
  const yaziTransition = animate
    ? "translate-y-[200px] opacity-0"
    : "translate-y-0 opacity-100";

  /* Dalga animasyonu:
     - Başlangıçta: dalga top-[55%] (yani biraz yukarıda)
     - Kaydırma sonrası: dalga top-[25%] (daha da yukarı)
  */
  const dalgaStyle = animate
    ? "top-[25%] transition-all duration-700"
    : "top-[55%] transition-all duration-700";

  return (
    <>
      {/* HERO BÖLÜMÜ – overflow-visible sayesinde dalga resmi dışarı taşabilir */}
      <div
        ref={containerRef}
        className="relative hidden lg:flex flex-col w-full h-screen overflow-visible z-[10]"
      >
        {/* Arka Plan Resmi */}
        <img
          src={media.desktopBackground.src}
          alt={media.desktopBackground.alt || "Girl"}
          className="absolute w-full h-full object-cover -top-[10%] left-0 -z-10 transform scale-[1.7] lg:scale-100 transition-transform duration-700"
        />

        {/* Beach & Pools Yazısı */}
        <div
          className={`
            absolute inset-0 lg:top-[18%] top-[18%] flex items-center justify-center
            transition-all duration-700 ${yaziTransition}
          `}
        >
          <img
            src={media.titleGraphic.src}
            alt={media.titleGraphic.alt || "Beach & Pools Yazı"}
            className="object-contain max-w-[50%] lg:max-w-[40%]"
          />
        </div>

        {/* Dalga Animasyonu – z-[50] ile diğer içeriklerin üstünde */}
        <div className={`absolute left-0 w-full max-h-[200vh] z-[50] ${dalgaStyle}`}>
          <img
            src={media.wave.src}
            alt={media.wave.alt || "Sea wave"}
            className="w-full object-cover"
          />
        </div>
      </div>

      {/* METİN BLOĞU VE EK İÇERİKLER */}
      <div
        className={`
          hidden lg:flex relative z-[20] transition-all duration-700
          ${textVisible ? "opacity-100" : "opacity-0"}
          w-full px-4 text-[#1d3535] text-center
          flex flex-col items-center justify-center gap-5
          -mt-24 mb-10
        `}
        // Arka planı genel kapsayıcıya uyguluyoruz, böylece dalga resmi (z-[50]) kalmaya devam ediyor
      >
        <p className="uppercase text-[12px] leading-[14px] tracking-[0.48px] font-medium font-jost">
         {t("subtitle")}
        </p>
        <h1 className="font-marcellus text-[28px] md:text-[32px] lg:text-[48px] leading-[120%] lg:leading-[57.6px] font-normal w-[35%]">
        {t("title")}
        </h1>
        <p className=" text-center font-jost text-[14px] lg:text-[16px] leading-[24px] w-[46%]">
        {t("text")}
        </p>
        <Link href="/beachpools#pools" className="uppercase text-sm font-medium font-marcellus text-[16px] lg:text-[18px] leading-[30px] underline underline-offset-4 mt-4 z-[999]">
        {t("buttonText")}
        </Link>

        {/* ClinaryInfoSection – negatif margin-top ile dalga resminin üst kısmının görünmesine izin veriyoruz */}
        <div className="flex relative mt-10 lg:-mt-20 2xl:-mt-32 lg:pt-[220px] 2xl:pt-[320px] justify-center z-[20]">
          <BeachClinary
            img1={media.info.primary}
            img2={media.info.secondary}
            span={t2("subtitle")}
            header={t2("title")}
            texts={texts}
          />
        </div>
      </div>
    </>
  );
}
