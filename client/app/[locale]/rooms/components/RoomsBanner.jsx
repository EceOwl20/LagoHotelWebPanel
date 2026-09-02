import React from 'react'
import roomsBanner from "../images/roomsBanner.png"
import Link from 'next/link'
import {useTranslations} from 'next-intl';

const RoomsBanner = ({ image }) => {
  const t = useTranslations('Accommodation');
  const backgroundImage = image?.src || roomsBanner.src;

  return (
    <div
      className='flex w-screen h-screen lg:items-end md:items-center md:justify-center lg:justify-end bg-center bg-cover'
      role="img"
      aria-label={image?.alt || undefined}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className='flex h-full w-full lg:w-[42%] bg-[#1D1D1B]/40 justify-center items-end md:items-center'>
      <div className="flex flex-col gap-[34px] 2xl:gap-[45px] md:gap-10 w-[80%] h-auto text-white text-center justify-center items-center mt-[16%] mb-[20px] lg:mb-0">
        <h2 className='font-marcellus text-[36px] lg:text-[44px] leading-[20px] -tracking-[0.88px] font-normal 2xl:mb-4'>{t('header')}</h2>
        <Link href="/rooms#superiorroom" className='flex py-[10px] px-[40px] border-[2px] border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] md:w-[50%] xl:w-[45%] lg:min-w-[337px]'>{t('buttonText1')}</Link>
        <Link href="/rooms#familyroom" className='flex py-[10px] px-[40px] border-[2px] border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] md:w-[50%] xl:w-[45%] lg:min-w-[337px]'>{t('buttonText2')}</Link>
        <Link href="/rooms#swimuproom" className='flex py-[10px] px-[40px] border-2 border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] md:w-[50%] xl:w-[45%] lg:min-w-[337px]'>{t('buttonText3')}</Link>
        <Link href="/rooms#familyswimup" className='flex py-[10px] px-[40px] border-[2px] border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] md:w-[50%] xl:w-[45%] lg:min-w-[337px]'>{t('buttonText4')}</Link>
        <Link href="/rooms#duplexfamilyroom" className='flex py-[10px] px-[40px] border-[2px] border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] xl:w-[45%] md:w-[50%] lg:min-w-[337px]'>{t('buttonText5')}</Link>
        {/* <Link href="/rooms#tinyvilla" className='flex py-[10px] px-[40px] border-[2px] border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] md:w-[50%] xl:w-[45%] lg:min-w-[337px]'>{t('buttonText6')}</Link> */}
        <Link href="/rooms#disableroom" className='flex py-[10px] px-[40px] border-[2px] border-white justify-center items-center shadow-buttonCustom gap-[65px] font-jost uppercase text-[14px] lg:text-[16px] font-medium leading-[30px] text-center bg-transparent w-[90%] xl:w-[45%] md:w-[50%] lg:min-w-[337px]'>{t('buttonText7')}</Link>
        
      </div>
      </div>
    </div>
  )
}

export default RoomsBanner
