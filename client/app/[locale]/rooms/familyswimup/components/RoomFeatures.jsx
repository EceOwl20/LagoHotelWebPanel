"use client"
import React, { useState, useEffect, useRef } from "react"
import ArrawDown from "@/app/[locale]/HomePage/Components/Icons/ArrawDown"
import DatePicker from "react-datepicker"
import PoolSvg from "./PoolSvg";
import BabycribSvg from "./BabycribSvg";
import SinglebedSvg from "./SinglebedSvg";
import PoolSvg2 from "./PoolSvg2";
import AreaSvg from "../../components/svg/AreaSvg";
import DarkPhoneSvg from "./DarkPhoneSvg";
import DresserSvg from "./DresserSvg";
import SmokingSvg from "./SmokingSvg";
import FridgeSvg from "./FridgeSvg";
import SafeboxSvg from "./SafeboxSvg";
import HairdryerSvg from "./HairdryerSvg";
import ShowerSvg from "./ShowerSvg";
import HandsoapSvg from "./HandsoapSvg";
import TeaCoffeeSvg from "./TeaCoffeeSvg";
import LedTvSvg from "./LedTvSvg";
import BalconySvg from "./BalconySvg";
import {useTranslations} from 'next-intl';
import Link from "next/link"

const RoomFeatures = ({span, header, text, header2, header3, text2, iconsTexts, roomName, pool}) => {
  const t = useTranslations(`${roomName}.RoomInfo`);
  const t2 = useTranslations(`SuperiorRoom.ReservationWidget`);
  const dropdownRef = useRef(null);

  const items = [
    { text: t("madde1"), icon: PoolSvg2 },
    { text: t("madde2"), icon: AreaSvg },
    { text: t("madde3"), icon: DresserSvg },
    { text: t("madde4"), icon: SmokingSvg },
    { text: t("madde5"), icon: FridgeSvg },
    { text: t("madde6"), icon: SafeboxSvg },
    { text: t("madde7"), icon: HairdryerSvg },
    { text: t("madde8"), icon: HandsoapSvg },
    { text: t("madde9"), icon: TeaCoffeeSvg },
    { text: t("madde10"), icon: LedTvSvg },
    { text: t("madde11"), icon: BalconySvg },
    { text: t("madde12"), icon: ShowerSvg },
  ];

  const [checkInDate, setCheckInDate] = useState(null)
  const [checkOutDate, setCheckOutDate] = useState(null)
  const [showGuests, setShowGuests] = useState(false)
  const [adults, setAdults] = useState(0)
  const [children, setChildren] = useState(0)
  const [guestInfo, setGuestInfo] = useState({})

    // Dışarıya tıklamayı yakalayıp dropdown'u kapatan effect
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowGuests(false);
        }
      };
  
      if (showGuests) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
  
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showGuests]);

  useEffect(() => {
    setGuestInfo({ checkInDate, checkOutDate, adults, children })
  }, [checkInDate, checkOutDate, adults, children])

  useEffect(() => {
    console.log("Guest Information:", guestInfo)
  }, [guestInfo])

  const toggleGuestsDropdown = () => setShowGuests((prev) => !prev)

  const incrementAdults = () => setAdults(adults + 1)
  const decrementAdults = () => adults > 0 && setAdults(adults - 1)

  const incrementChildren = () => setChildren(children + 1)
  const decrementChildren = () => children > 0 && setChildren(children - 1)

  const filteredItems = pool ? items : items.slice(1);

  return (
    <div className="flex w-screen h-auto items-center justify-center bg-[#fbfbfb] max-w-[1440px]">
      <div className="flex flex-col md:flex-row w-[87.79%] md:w-[91.4%] lg:w-[76.8%] items-center md:items-start justify-center gap-[35px] md:gap-[4.5%] ">
        
        <div className="flex flex-col gap-[30px] w-[95%] md:w-[63%] items-start justify-start font-jost">
          <div className="flex flex-col w-full items-start justify-center text-start font-jost gap-[10px]">
            <span className="text-lagoGray text-[12px] leading-[14px] font-medium tracking-[0.48px] uppercase">
             {span}
            </span>
            <h2 className="text-[28px] lg:text-[32px] text-lagoBrown font-marcellus font-normal leading-normal">
            {header}
            </h2>
            <p className="text-lagoBlack text-[14px] lg:text-[16px] leading-normal font-normal">
            {text}
            </p>
          </div>

          <div className="flex flex-col w-full items-start justify-center gap-[17px]">
            <h3 className="text-[25px] lg:text-[28px] text-lagoBlack leading-[120%] font-normal font-marcellus">
            {header2}
            </h3>

            <div className="sm:flex grid grid-cols-2 sm:flex-row gap-[10px] lg:gap-[15px] w-full items-center justify-start">

           { pool && (
              <div className="flex items-center justify-start text-center w-[100%] sm:w-[32.5%] gap-[0px] lg:gap-[10px] bg-[#4B4E4F14] h-[70px] md:h-[60px]">
              <PoolSvg className="flex" width={65} height={60} />
              <p className="text-[14px] lg:text-[16px] text-lagoBlack font-marcellus font-normal leading-[16px]">
              {iconsTexts[0]}
              </p>
            </div>
           )

           }

              <div className="flex items-center justify-start text-center w-[100%] sm:w-[32.5%] gap-[0px] lg:gap-[10px] bg-[#4B4E4F14] h-[70px] md:h-[60px]">
                <div className="flex py-[10px] px-[3px] lg:px-[6px]">
                  <SinglebedSvg className="flex" width={32} height={35} />
                  <SinglebedSvg
                    className="flex -ml-[12px]"
                    width={32}
                    height={35}
                  />
                </div>
                <p className="text-[14px] lg:text-[16px] text-lagoBlack font-marcellus font-normal leading-[16px] ">
                {iconsTexts[1]}
                </p>
              </div>

              <div className="flex items-center justify-start text-center w-[100%] sm:w-[32.5%] gap-[0px] lg:gap-[10px] bg-[#4B4E4F14] h-[70px] md:h-[60px]">
                <BabycribSvg className="flex px-[11px] py-[9px]" width={38} height={38} />
                <p className="text-[14px] lg:text-[16px] text-lagoBlack font-marcellus font-normal leading-[16px]">
                {iconsTexts[2]}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full items-start justify-center gap-[10px]">
            <h3 className="text-[25px] lg:text-[28px] text-lagoBlack leading-[120%] font-normal font-marcellus">
            {header3}
            </h3>
            <p className="text-[14px] lg:text-[16px] font-normal leading-normal text-lagoBlack">
            {text2}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[15px] md:gap-[25px] lg:gap-[35px] items-start justify-start w-full">
            {filteredItems.map((item, index) => (
              <div
                key={index}
                className="flex gap-[14px] items-center justify-start"
              >
                <div className="p-[8px] flex border bg-transparent border-lagoBrown items-center justify-center text-center">
                  <item.icon className="flex" width={20} height={20} />
                </div>
                <p className="text-lagoBrown text-[15px] font-medium leading-[120%] -tracking-[0.3px]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* resevation */}
        <div className="flex flex-col w-[95%] md:w-[32.5%] gap-[35px] pb-[16px] font-jost">
        <div className="flex flex-col w-full py-[50px] lg:pl-[50px] items-center lg:items-start justify-center text-center gap-[20px] bg-white shadow-divCustom lg:min-w-[330px]">
            <div className="flex flex-col gap-[10px] w-[94%] lg:w-full mb-[5px] items-center lg:items-start text-center lg:text-start">
            <h3 className="text-[28px] lg:text-[32px] text-lagoBrown font-marcellus font-normal leading-[120%] -tracking-[0.64px]">{t2("title")}</h3>
            <p className="text-[16px] text-lagoBrown leading-[140%] font-normal font-jost">{t2("text")}</p>
            </div>

          <div className="relative flex items-center justify-center w-auto ">
          <label htmlFor="checkInDate" className="sr-only text-white">
           {t2("checkin")}
          </label>
          <DatePicker
            id="checkInDate"
            selected={checkInDate}
            onChange={(date) => setCheckInDate(date)}
            placeholderText=  {t2("checkin")}
            className="
              cursor-pointer 
              items-center text-start justify-start p-[18px] h-[47px] w-[70vw] sm:w-[50vw] md:w-[23vw] lg:w-[250px] border border-lagoBlack
              text-customGray 
              focus:outline-none 
              bg-transparent 
            placeholder:text-lagoGray
              placeholder:text-[16px]
              placeholder:leading-[140%]
              placeholder:font-normal
              placeholder:font-jost"
            popperPlacement="bottom-start"
            calendarClassName="custom-calendar"
            dayClassName={() => "custom-day hover:bg-blue-100 focus:outline-none"}
          />
        </div>

            <div className="relative flex items-center justify-center w-auto ">
          <label htmlFor="checkOutDate" className="sr-only">
          {t2("checkout")}
      
          </label>
          <DatePicker
            id="checkOutDate"
            selected={checkOutDate}
            onChange={(date) => setCheckOutDate(date)}
            placeholderText=  {t2("checkout")}
            className="
              cursor-pointer 
              items-center text-start justify-start p-[18px] h-[47px] w-[70vw] sm:w-[50vw] md:w-[23vw] lg:w-[250px] border border-lagoBlack
              text-customGray 
              focus:outline-none 
              bg-transparent 
            placeholder:text-lagoGray
              placeholder:text-[16px]
              placeholder:leading-[140%]
              placeholder:font-normal
              placeholder:font-jost"
            popperPlacement="bottom-start"
            calendarClassName="custom-calendar"
            dayClassName={() => "custom-day hover:bg-blue-100 focus:outline-none"}/>
        </div>

        {/* guest */}
        <div className="relative flex items-center justify-center w-auto" ref={dropdownRef}>
          <label htmlFor="guests-button" className="sr-only">
            Select number of guests
          </label>
          <button
            id="guests-button"
            onClick={toggleGuestsDropdown}
            className="
              cursor-pointer 
              items-center text-start justify-center px-[18px] h-[47px] w-[70vw] sm:w-[50vw] md:w-[23vw] lg:w-[250px] border border-lagoBlack
              focus:outline-none 
              bg-transparent 
              text-[16px]
              leading-[140%]
              placeholder:font-normal
              font-jost text-lagoGray"   
            aria-haspopup="dialog"
            aria-expanded={showGuests}
            type="button">
             <span> {adults === 0 ? t2("adult") : `${adults} ${t2("adult")}`}</span>{" "}/{" "}
             <span> {children === 0 ? t2("kids") : `${children} ${t2("kids")}`}</span>
           
          </button>
          {showGuests && (
            <div
              className="
                absolute 
                left-1/2 
                -translate-x-1/2
                mt-2
                top-10 
                bg-lagoBlack
                border 
                border-lagoGray
                text-white
                text-[14px] 
                font-semibold 
                shadow-lg 
                w-full 
                min-w-[180px] 
                p-3 
                xl:p-4 z-[20]"
               
              role="dialog"
              aria-modal="false"
              aria-label="Select number of adults and children">
              {/* Adults */}
              <div className="flex justify-between items-center mb-3">
                <label
                  htmlFor="adultCounter"
                  id="adultCounterLabel"
                  className="whitespace-nowrap">
                  {t2("adult")}
                </label>
                <div className="flex items-center gap-1 lg:gap-2" id="adultCounter">
                  <button
                    onClick={decrementAdults}
                    className="
                      cursor-pointer 
                      w-5 
                      h-5 
                      xl:w-6 
                      xl:h-6 
                      border 
                      border-gray-400 
                      rounded-full 
                      flex 
                      items-center 
                      justify-center 
                      font-medium"
                    aria-labelledby="adultCounterLabel"
                    aria-label="Decrease adults"
                    type="button" >-
                  </button>
                  <span>{adults}</span>
                  <button
                    onClick={incrementAdults}
                    className="
                      cursor-pointer 
                      w-5 
                      h-5 
                      xl:w-6 
                      xl:h-6 
                      border 
                      border-gray-400 
                      rounded-full 
                      flex 
                      items-center 
                      justify-center 
                      font-medium"
                    aria-labelledby="adultCounterLabel"
                    aria-label="Increase adults"
                    type="button" >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex justify-between items-center">
                <label
                  htmlFor="childrenCounter"
                  id="childrenCounterLabel"
                  className="whitespace-nowrap"
                >
                  {t2("kids")}
                </label>
                <div className="flex items-center gap-1 lg:gap-2" id="childrenCounter">
                  <button
                    onClick={decrementChildren}
                    className="
                      cursor-pointer 
                      w-5 
                      h-5 
                      xl:w-6 
                      xl:h-6 
                      border 
                      border-gray-400 
                      rounded-full 
                      flex 
                      items-center 
                      justify-center 
                      font-medium
                    "
                    aria-labelledby="childrenCounterLabel"
                    aria-label="Decrease children"
                    type="button"
                  >
                    -
                  </button>
                  <span>{children}</span>
                  <button
                    onClick={incrementChildren}
                    className="
                      cursor-pointer 
                      w-5 
                      h-5 
                      xl:w-6 
                      xl:h-6 
                      border 
                      border-gray-400 
                      rounded-full 
                      flex 
                      items-center 
                      justify-center 
                      font-medium
                    "
                    aria-labelledby="childrenCounterLabel"
                    aria-label="Increase children"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
              
            </div>
          )}
       
        </div>
            
            <Link href="https://lagohotel.orsmod.com/"
           rel="norefferer nofollower"
                  target="_blank"
              className="flex p-5 text-white items-center justify-center text-center bg-lagoBlack border h-[47px] border-lagoBlack lg:w-[175px] shadow-buttonCustom text-[16px] uppercase font-semibold font-jost leading-[120%] hover:bg-white hover:underline hover:text-lagoBlack">{t2("booknow")}</Link>
        </div>
        <div className="flex flex-col items-center justify-center w-full gap-[17px] bg-white py-[15px] shadow-divCustom">
          <h4 className="text-[28px] font-marcellus font-normal text-lagoBlack leading-[120%] -tracking-[0.56px] leading-trim-both">{t2("contact")}</h4>
          <div className="flex gap-[11px] items-center justify-center w-full">
            <DarkPhoneSvg className="flex" width={20} height={20} />
          <a href="tel:+902425245787" className="text-[16px] cursor-pointer text-lagoBlack font-medium font-jost leading-[120%] -tracking-[0.32px]"> {t2("phone")}</a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RoomFeatures;
