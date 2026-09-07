import React from 'react'
import HomePage1 from "./Components/HomePage"
import HomePage2 from "./Components/HomePage1"
import HomePage3 from "./Components/HomePage2"
import HomePage4 from "./Components/HomePage3"
import HomePage5 from "./Components/HomePage4"
import HomePage6 from "./Components/HomePage5"
import ContactSection from '../GeneralComponents/Contact/ContactSection'
import EmblaCarousel from "./Components/Slider/Slider1"
import TwoAnimationImage from "./Components/TwoAnimationImage"

function getLocalizedImage(item, locale) {
  return {
    src: item.image,
    alt: item.translations?.[locale]?.alt || "",
  };
}

const HomePage = ({ media, locale }) => {
  const carouselImages = Object.fromEntries(
    Object.entries(media.carousel).map(([key, image]) => [
      key,
      getLocalizedImage(image, locale),
    ])
  );
  const accommodationImages = Object.fromEntries(
    Object.entries(media.accommodationCards).map(([key, image]) => [
      key,
      getLocalizedImage(image, locale),
    ])
  );

  return (
    <div >
        <HomePage1 />
        <HomePage2 />
        <EmblaCarousel images={carouselImages} options={{ loop: true }} />
     <div className='flex flex-col items-center justify-center w-screen gap-[60px] md:gap-[80px] lg:gap-[100px] bg-[#fbfbfb]'>
     {/* <HomePage3 /> */}
     <TwoAnimationImage
       backgroundImage={getLocalizedImage(media.experience.background, locale)}
       foregroundImage={getLocalizedImage(media.experience.foreground, locale)}
     />
     <HomePage4 images={accommodationImages} />
        <HomePage5 />
        <ContactSection />
        <HomePage6 backgroundImage={getLocalizedImage(media.banner, locale)} />
     </div>
        
    </div>
  )
}

export default HomePage
