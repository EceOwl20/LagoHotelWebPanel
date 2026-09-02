import React from 'react'
import ForestSvg from './ForestSvg'
import BabySvg from './BabySvg'
import LivingroomSvg from './LivingroomSvg'
import BedSvg from './BedSvg'
import SeaSvg from './SeaSvg'
import ParentsSvg from './ParentsSvg'

const SubRoomBanner = ({img,span,header,texts=[], baby}) => {


  return (
    <div
      className='flex w-screen h-screen lg:h-[80vh] items-center justify-center bg-cover bg-center relative'
      role="img"
      aria-label={img.alt || undefined}
      style={{ backgroundImage: `url(${img.src})` }}
    >
      <div className='absolute inset-0 bg-lagoBlack/40 z-[1]'></div>
      <div className='flex flex-col w-[80%] h-full items-center justify-center text-white font-jost gap-[35px] md:gap-[39px] lg:mb-0 z-[20]'>
        <span className='text-[12px] lg:text-[16px] font-medium leading-[14px] tracking-[0.6px] uppercase text-center whitespace-nowrap'>{span}</span>
        <h2 className="capsizedText text-[40px] md:text-[56px] lg:text-[80px] leading-[42px] lg:leading-[106px] font-medium ">{header}</h2>

        <div className='flex flex-col sm:flex-row w-full items-center justify-center gap-[16px] lg:h-[103px]'>
            <div className='flex items-center justify-center gap-[20px] px-[26px]'>
                <div className='flex flex-col gap-[18px] items-center justify-center'>
                <div className='flex  gap-[20px] items-center justify-center'>
                    <ForestSvg className="flex" width={35} height={36}/>
                    <SeaSvg className="flex" width={35} height={35}/>
                    </div>
                    <p className='text-[14px] lg:text-[16px] font-medium leading-normal capitalize'>{texts[0]}</p>
                </div>
            </div>

            <div className='flex items-center justify-center gap-[20px] px-[26px]'>
                <div className='flex flex-col gap-[18px] items-center justify-center'>
                <div className='flex  gap-[20px] items-center justify-center'>
                <ParentsSvg className="flex" width={43} height={35}/>
                { baby && (
                  <BabySvg className="flex" width={35} height={36}/>
                )

                }
                    </div>
                    <p className='text-[14px] lg:text-[16px] font-medium leading-normal'>{texts[1]}</p>
                </div>
            </div>

            <div className='flex items-center justify-center gap-[20px] px-[26px]'>
                <div className='flex flex-col gap-[18px] items-center justify-center'>
                <div className='flex  gap-[20px] items-center justify-center'>
                <LivingroomSvg className="flex" width={40} height={45}/>
                <BedSvg className="flex" width={35} height={36}/>
                    </div>
                    <p className='text-[14px] lg:text-[16px] font-medium leading-normal'>{texts[2]}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

export default SubRoomBanner
