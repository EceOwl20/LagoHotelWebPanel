import React from 'react'

const RestaurantMainBanner = ({img,header,span,text}) => {
  return (
    <div className='flex w-screen h-screen lg:min-h-screen items-center justify-center bg-center bg-cover' role="img" aria-label={img.alt || undefined} style={{ backgroundImage: `url(${img.src})` }}>
      <div className='flex flex-col w-[90%] lg:w-[50%] items-center justify-center text-center gap-[30px] lg:gap-[50px] text-white font-jost'>
        <span className='text-[12px] md:text-[14px] font-medium leading-[14px] tracking-[0.6px] uppercase'>{span}</span>
        <h1 className='text-[40px] md:text-[56px] lg:text-[80px] leading-[28.8px] -tracking-[0.48px] md:tracking-0 font-medium md:leading-[61.6px] lg:leading-[106px] lg:capsizedText font-jost'>{header}</h1>
        <p className='text-[16px] lg:text-[18px] font-normal leading-[130%] lg:leading-[30px] w-[95%] md:w-[588px]'>{text}</p>
      </div>
    </div>
  )
}

export default RestaurantMainBanner
