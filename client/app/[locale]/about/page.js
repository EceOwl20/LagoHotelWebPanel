import React from 'react'
import MainBanner2 from '../GeneralComponents/MainBanner2'
import SpaTypesInfoSection from '../spawellness/components/SpaTypesInfoSection'
import MissionVisionSection from './components/MissionVisionSection'
import EmblaCarousel from "../HomePage/Components/Slider/Slider1"
import KidsMomentCarousel from '../kidsclub/components/KidsMomentCarousel'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2'
import { getTranslations } from 'next-intl/server';
import { readSitePageContent } from '@/lib/admin/site-pages';

function getLocalizedImage(item, locale) {
  return {
    src: item.image,
    alt: item.translations?.[locale]?.alt || "",
  };
}

function getLocalizedCollection(collection, locale) {
  return [...(collection?.images || [])]
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.translations?.[locale]?.alt || "",
      width: image.width,
      height: image.height,
    }));
}

const Page = async ({ params }) => {
  const { locale } = await params;
  const [t, t2, t3, media] = await Promise.all([
    getTranslations({ locale, namespace: 'About' }),
    getTranslations({ locale, namespace: 'About.InfoSection' }),
    getTranslations({ locale, namespace: 'About.MissinonVision' }),
    readSitePageContent('about'),
  ]);

  const texts=[t3("subtitle"),t3("title"),t3("text")]
const texts2=[t3("clubsubtitle1"),t3("clubtitle1"),t3("clubtext1")]
const texts3=[t3("clubsubtitle2"),t3("clubtitle2"),t3("clubtext2")]
  const discoveryImages = Object.fromEntries(
    Object.entries(media.discoveryCarousel).map(([key, image]) => [
      key,
      getLocalizedImage(image, locale),
    ])
  );

  return (
    <div className='flex flex-col items-center justify-center gap-[60px] md:gap-[80px] lg:gap-[100px] bg-[#fbfbfb]'>
      <MainBanner2 span={t("subtitle")} header={t("title")} img={getLocalizedImage(media.hero, locale)} opacity={true}/>
      <SpaTypesInfoSection isImageLeft={false} span={t2("subtitle")} header={t2("title")} text={t2("text")} link="/" showLink={true} img={{ ...getLocalizedImage(media.location, locale), width: 538, height: 412 }} buttonText={t2("buttonText")}/>
      <KidsMomentCarousel showheader={false} header="" images={getLocalizedCollection(media.moments, locale)}/>
      <MissionVisionSection texts={texts} texts2={texts2} texts3={texts3} leftImg={getLocalizedImage(media.missionVision.mission, locale)} rightImg={getLocalizedImage(media.missionVision.vision, locale)} documentImage={getLocalizedImage(media.missionVision.document, locale)} showLink={false} buttonText={t3("buttonText")}/>
      <EmblaCarousel images={discoveryImages} options={{ loop: true }}/>
      <ContactSection2/>
    </div>
  )
}

export default Page
