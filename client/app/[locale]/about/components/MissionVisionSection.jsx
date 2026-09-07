"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import imgVizyonMission from "../images/vizyonmisyon.png"

// Tekrarlanan sütun yapısını modüler hale getiren bileşen
const MissionColumn = ({
  img,
  spanText,
  heading,
  paragraph,
  showLink,
  link,
  buttonText
}) => (
  <div className="flex flex-col w-full md:w-[49%] items-start justify-center text-start gap-[15px] lg:gap-[25px] font-jost text-black">
    <Image
      src={img.src || img}
      width={img.width || 1200}
      height={img.height || 706}
      alt={img.alt || ""}
      className="flex aspect-[534/314] w-full object-cover"
    />
    <span className="text-[12px] font-medium leading-[14px] tracking-[0.48px] uppercase">
      {spanText}
    </span>
    <h4 className="text-[25px] lg:text-[30px] font-normal leading-[120%] lg:leading-[57.6px] lg:capitalize font-marcellus capsizedText3">
      {heading}
    </h4>
    <p className="text-[14px] font-normal leading-[21px] w-[99%]">
      {paragraph}
    </p>
    {showLink && (
      <Link
        href={link}
        className="flex w-[170.585px] whitespace-nowrap py-[16px] px-[32px] font-jost text-[14px] lg:text-[16px] text-lagoBrown font-medium leading-[30px] max-h-[41px] items-center justify-center border border-lagoBrown shadow-buttonCustom uppercase"
      >
        {buttonText}
      </Link>
    )}
  </div>
);

const MissionDocument = ({ sections = [] }) => (
  <div className="flex w-full flex-col gap-[28px] rounded-[24px] border border-[#DED9D1] bg-white px-[24px] py-[28px] shadow-custom md:px-[40px] md:py-[36px] lg:px-[56px] lg:py-[48px]">
    {sections.map((section) => (
      <div
        key={section.title}
        className="flex flex-col items-start gap-[14px] text-start"
      >
        <h4 className="font-marcellus text-[20px] font-normal uppercase leading-[120%] tracking-[0.48px] text-lagoBlack md:text-[24px] lg:text-[28px]">
          {section.title}
        </h4>
        {section.paragraphs.map((paragraph, index) => (
          <p
            key={`${section.title}-${index}`}
            className="font-jost text-[14px] font-normal leading-[24px] text-lagoGray lg:text-[16px]"
          >
            {paragraph}
          </p>
        ))}
      </div>
    ))}
  </div>
);

const MissionVisionSection = ({
  texts = [],
  texts2 = [],
  texts3 = [],
  leftImg,
  rightImg,
  showLink,
  link1,
  link2,
  buttonText,
  documentImage,
  documentSections = []
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    startIndex: 0,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleDownload = (e, href, label) => {
    e.preventDefault();
    if (window.confirm(`“${label}” dosyasını indirmek istediğinize emin misiniz?`)) {
      window.open(href, "_blank");
    }
  };

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      });
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  const hasDocumentSections = documentSections.length > 0;

  return (
    <div className="flex w-screen items-center justify-center max-w-[1440px]">
      <div className="flex flex-col w-[87.79%] md:w-[91.4%] lg:w-[76.8%] items-center justify-center gap-[30px] lg:gap-[50px]">
        {/* Üst metin alanı */}
        <div className="flex flex-col items-center justify-normal lg:w-[65%] text-center font-jost text-black gap-[15px] md:gap-[25px] lg:gap-[35px]">
          <span className="text-[12px] font-medium leading-[14px] uppercase tracking-[0.48px]">
            {texts[0]}
          </span>
          <h3 className="text-[28px] md:text-[32px] lg:text-[48px] font-normal leading-[120%] lg:leading-[57.6px] font-marcellus">
            {texts[1]}
          </h3>
          <p className="text-[14px] lg:text-[16px] font-normal leading-[24px]">
            {texts[2]}
          </p>
        </div>

        {/* Masaüstü görünümü: İki sütun */}
        <div className="hidden md:flex w-full items-start justify-center gap-[2%]">
          <MissionColumn
            img={leftImg}
            spanText={texts2[0]}
            heading={texts2[1]}
            paragraph={texts2[2]}
            showLink={showLink}
            link={link1}
            buttonText={buttonText}
          />
          <MissionColumn
            img={rightImg}
            spanText={texts3[0]}
            heading={texts3[1]}
            paragraph={texts3[2]}
            showLink={showLink}
            link={link2}
            buttonText={buttonText}
          />
        </div>

        {/* PDF indirme linki */}
        <div className="flex w-full flex-col items-center justify-center gap-4">
          {hasDocumentSections ? (
            <MissionDocument sections={documentSections} />
          ) : (
            <Image
              src={documentImage?.src || imgVizyonMission}
              alt={documentImage?.alt || "vizyonmisyon"}
              width={documentImage?.width || imgVizyonMission.width}
              height={documentImage?.height || imgVizyonMission.height}
            />
          )}
        </div>

        {/* Mobil görünüm: Carousel (md:hidden) */}
        <div className="md:hidden w-full overflow-hidden" ref={emblaRef}>
          <div className="flex">
            <div className="flex-[0_0_90%] mr-[4%]">
              <MissionColumn
                img={leftImg}
                spanText={texts2[0]}
                heading={texts2[1]}
                paragraph={texts2[2]}
                showLink={showLink}
                link={link1}
                buttonText={buttonText}
              />
            </div>
            <div className="flex-[0_0_100%]">
              <MissionColumn
                img={rightImg}
                spanText={texts3[0]}
                heading={texts3[1]}
                paragraph={texts3[2]}
                showLink={showLink}
                link={link2}
                buttonText={buttonText}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionVisionSection;
