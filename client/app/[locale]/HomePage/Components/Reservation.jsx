"use client"

import ArrawDown from "@/app/[locale]/HomePage/Components/Icons/ArrawDown"
import React, { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import { useTranslations } from "next-intl";
import Link from "next/link"

export default function Reservation() {
  const t = useTranslations('Reservation');

  const [checkInDate, setCheckInDate] = useState(null)
  const [checkOutDate, setCheckOutDate] = useState(null)
  const [showGuests, setShowGuests] = useState(false)
  const [adults, setAdults] = useState(0)
  const [children, setChildren] = useState(0)
  const [guestInfo, setGuestInfo] = useState({})

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

  return (
    <section
      /* 
        1) absolute, top-0 + z-20 => videonun ve diğer öğelerin üstünde yer alabilir
        2) bg-[#1D1D1B] + bg-opacity-50 => header ile aynı renk ve opacity
        3) istediğin kadar top değeri verebilirsin (ör. top-[100px]) 
      */
      className="
        hidden
        md:flex
        absolute 
        bottom-0  
        left-0 
        right-0
        w-screen 
        h-auto 
        z-20 
        items-center 
        justify-center
        bg-[#1D1D1B] 
        bg-opacity-50
      "
      aria-labelledby="reservation-heading"
    >
      {/* Ekran okuyucu kullanıcılar için (opsiyonel) */}
      {/* <h2 id="reservation-heading" className="sr-only">Reservation Form</h2> */}

      <form
        className="
          flex 
          flex-row 
          w-[95%]
          lg:w-screen
          items-center 
          h-auto
          max-h-content
          justify-center 
          text-[#ffffff] 
          font-jost 
          leading-normal 
          text-center
          gap-[40px]
          lg:gap-[50px]
   
        "
      >
        <div className="hidden lg:flex">
          <p className="uppercase text-[16px] text-white text-center font-jost font-medium leading-[24px] w-auto ">
          {t("text")}
          </p>
        </div>

        {/* İnce çizgi */}
        <div className="w-[1px] h-[11px] bg-white hidden lg:flex" />

        {/* CHECK-IN */}
        <div className="relative flex items-center justify-center w-auto ">
          <label htmlFor="checkInDate" className="sr-only text-white">
          {t("checkin")}
          </label>
          <DatePicker
            id="checkInDate"
            selected={checkInDate}
            onChange={(date) => setCheckInDate(date)}
            placeholderText= {t("checkin")}
            className="
              cursor-pointer 
              py-[30px] 
              lg:w-auto 
              text-customGray 
              focus:outline-none 
              bg-transparent 
              text-center 
            placeholder:text-white
              placeholder:uppercase
              placeholder:text-[16px]
              placeholder:leading-[24px]
              placeholder:font-medium
              placeholder:font-jost
            "
            popperPlacement="bottom-start"
            calendarClassName="custom-calendar"
            dayClassName={() => "custom-day hover:bg-blue-100 focus:outline-none"}
          />
          <ArrawDown className="absolute right-[10px]" width={12} height={12} />
        </div>


        {/* İnce çizgi */}
        <div className="w-[1px] h-[11px] bg-white" />


        {/* CHECK-OUT */}
        <div className="relative flex items-center justify-center w-auto ">
          <label htmlFor="checkOutDate" className="sr-only">
          {t("checkout")}
      
          </label>
          <DatePicker
            id="checkOutDate"
            selected={checkOutDate}
            onChange={(date) => setCheckOutDate(date)}
            placeholderText= {t("checkout")}
            className="
              cursor-pointer 
              py-[30px] 
              text-customGray 
              focus:outline-none 
              bg-transparent 
              text-center 
              placeholder:text-white
              placeholder:uppercase
              placeholder:text-[16px]
              placeholder:leading-[24px]
              placeholder:font-medium
              placeholder:font-jost"
            popperPlacement="bottom-start"
            calendarClassName="custom-calendar"
            dayClassName={() => "custom-day hover:bg-blue-100 focus:outline-none"}/>
             <ArrawDown className="absolute right-[3px]" width={12} height={12} />
        </div>


        {/* İnce çizgi */}
        <div className="w-[1px] h-[11px] bg-white " />




        {/* GUESTS */}
        <div className="relative flex items-center justify-center w-auto">
          <label htmlFor="guests-button" className="sr-only">
            Select number of guests
          </label>
          <button
            id="guests-button"
            onClick={toggleGuestsDropdown}
            className="
              flex
              items-center justify-center
              py-[30px] 
              w-full 
              text-customGray
              bg-transparent
              focus:outline-none
              text-center
              relative
            placeholder:text-white
              uppercase
             text-[16px]
              leading-[24px]
              font-medium
              font-jost"
            aria-haspopup="dialog"
            aria-expanded={showGuests}
            type="button">
            {t("guests")}
            <ArrawDown className="flex ml-[13px]" width={12} height={12} />
          </button>
          {showGuests && (
            <div
              className="
                absolute 
                bottom-full 
                -left-1/2 
                mt-2 
                bg-transparent 
                border 
                border-gray-300 
                text-[#ffff] 
                text-[14px] 
                font-semibold 
                rounded-lg 
                shadow-lg 
                w-full 
                min-w-[180px] 
                p-3 
                xl:p-4"
              role="dialog"
              aria-modal="false"
              aria-label="Select number of adults and children">
              {/* Adults */}
              <div className="flex justify-between items-center mb-3">
                <label
                  htmlFor="adultCounter"
                  id="adultCounterLabel"
                  className="whitespace-nowrap">
                  Adult(s)
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
                  Child(ren)
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

        <Link href="https://lagohotel.orsmod.com/">
        <button
          onClick={() => console.log("Final Guest Information:", guestInfo)}
          className="
            cursor-pointer 
            border 
            px-[47px] 
            py-[13px] 
            border-white
            text-white
            whitespace-nowrap
            text-[16px]
            font-medium
            uppercase
            font-jost
            text-center 
            justify-center
            items-center
            bg-transparent
            capsizedText4
            max-w-[156px]
            
          "
          type="button"
        >
       {t("search")}
        </button>
        </Link>
      </form>
    </section>
  )
}
