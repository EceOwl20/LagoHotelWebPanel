import Image from 'next/image'
import React from 'react'
import LSvg from './LSvg'
import ASvg from './ASvg'
import GSvg from './GSvg'
import OSvg from './OSvg'
import {useTranslations} from 'next-intl';

const ActivitiesSection = ({ images }) => {
  const t = useTranslations('Entertainment');
  const t2 = useTranslations('Entertainment.InfoSection');

  return (
    <div className='flex w-screen h-auto  items-center justify-center'>
      <div className='flex flex-col w-full items-center justify-center gap-[30px] lg:gap-[50px]'>
        <div className='flex flex-col  w-[87.79%] md:w-[91.4%] lg:w-[76.8%] gap-[15px] md:gap-[25px] lg:gap-[35px] items-center justify-center text-black font-jost text-center max-w-[1106px]'>
            <span className='text-[12px] leading-[14px] font-medium uppercase tracking-[0.48px]'>{t("subtitle")}</span>
            <h2 className='text-[28px] md:text-[32px] lg:text-[48px] leading-[120%] lg:leading-[57.6px] font-normal font-marcellus lg:capsizedText2'>{t("title")}</h2>
            <p className='text-[14px] leading-[18px] lg.text-[16px] font-normal lg:leading-[24px] lg:w-[55%]'>{t("text")}</p>
        </div>

        <div className='flex w-full items-center justify-center relative max-w-[1440px]'>
           <div className='flex flex-col md:flex-row  w-[87.79%] md:w-[91.4%] lg:w-[76.8%] gap-[20px] lg:gap-[30px] items-center justify-center '>

           <div className='flex flex-col  w-[300px] md:w-[538px] h-full relative'>
           <Image src={images.daytime.src} alt={images.daytime.alt || "daytime"} width={images.daytime.width || 1600} height={images.daytime.height || 1067} className='w-full'/>
           <div className='flex flex-col absolute bottom-[38px] left-[35px] items-start justify-center text-start gap-[25px] pb-[10px] text-white '>
            <span className='text-[12px] font-normal uppercase  font-jost leading-normal tracking-[0.48px]'>{t2("experiences")}</span>
            <h4 className='font-marcellus text-[30px] font-normal capsizedText3 leading-[40px]' >{t2("title")}</h4>
           </div>
           </div>
           
            <div className='flex flex-col w-[300px] md:w-[538px] h-full relative'>
            <Image src={images.nighttime.src} alt={images.nighttime.alt || "nighttime"} width={images.nighttime.width || 1600} height={images.nighttime.height || 1067} className='w-full'/>
           <div className='flex flex-col absolute bottom-[38px] left-[35px] items-start justify-center text-start gap-[15px] md:gap-[25px] pb-[10px] text-white '>
            <span className='text-[12px] font-normal uppercase  font-jost leading-normal tracking-[0.48px]'>{t2("experiences")}</span>
            <h4 className='font-marcellus text-[30px] font-normal leading-[120%] lg:capsizedText3 '>{t2("title2")}</h4>
           </div>
           </div>
           </div>

            <div className='absolute inset-0 items-center justify-between flex w-full'>
                <LSvg className="flex w-[15.5%] h-auto" />
                <ASvg className="flex w-[23.3%]  h-auto" />
                <GSvg className="flex w-[21.6%]  h-auto" />
                <OSvg className="flex w-[21.5%]  h-auto" />
            </div>
        </div>
       
      </div>
    </div>
  )
}

export default ActivitiesSection
