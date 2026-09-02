import React from "react";
import { Link } from '@/i18n/navigation';

const BackgroundSection = ({
  span,
  header,
  texts = [],
  img,
  link = "#",
  buttonText
}) => {
  // img objesi verilmediyse veya içinde src yoksa, arkaplanı boş bırakalım.
  const backgroundImage = img?.src ? `url(${img.src})` : "none";

  return (
    <div
      className="flex w-screen h-[45vh] min-h-[453px] items-end justify-end bg-cover bg-center"
      role="img"
      aria-label={img?.alt || undefined}
      style={{ backgroundImage }}
    >
      <div className="flex h-full w-[100%] md:w-[43%] lg:w-[46%] max-w-[840px] items-center justify-start bg-[#2D2D26]/50">
        <div className="flex flex-col items-start justify-center h-full w-[87.79%] md:w-[91.4%] lg:w-[66%] lg:min-w-[443px]  gap-[20px] lg:gap-[30px] ml-[6.10%] md:ml-[4.3%] lg:ml-[10%]  lg:mb-[8%] lg:mt-[9%]  text-white font-jost text-start">
          {/* span varsa göster */}
          {span && (
            <span className="text-[12px] font-medium leading-[14px] tracking-[0.48px] uppercase">
              {span}
            </span>
          )}

          {/* header varsa göster */}
          {header && (
            <h2 className="text-[28px] md:text-[36px] lg:text-[48px] font-marcellus font-normal leading-normal lg:leading-[63.6094px] capsizedText2">
              {header} 
            </h2>
          )}

          {/* texts[0] varsa paragraf olarak göster */}
          {texts[0] && (
            <p className="text-[14px] lg:text-[16px] font-normal leading-[24px]">
              {texts[0]}
            </p>
          )}

          {/* eğer texts 2 elemandan azsa (1 veya 2), ikinci metni normal paragraf olarak göster */}
          {texts.length < 3 && texts[1] && (
            <p className="text-[14px] font-normal leading-[21px] leading-trim-both text-edge-cap ">
              {texts[1]}
            </p>
          )}

          {/* 3 veya daha fazla metin varsa, ilk metinden sonrasını liste olarak göster */}
          {texts.length >= 3 && (
            <ul className="text-[14px] font-normal leading-[21px] list-disc pl-5 marker:text-xs marker:text-white ">
              {texts.slice(1).map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
          )}

          {/* Bağlantı */}
          <Link
            href={link}
            className="text-[14px] lg:text-[16px] font-normal leading-normal ml-[4px] font-marcellus uppercase border-b border-white pb-[8px] h-[24px] text-center w-auto items-center justify-center"
          >
           {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSection;
