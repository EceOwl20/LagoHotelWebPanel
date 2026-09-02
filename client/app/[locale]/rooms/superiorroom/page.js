import SubRoomBanner from '../familyswimup/components/SubRoomBanner'
import SubroomCarousel from '../familyswimup/components/SubroomCarousel'
import RoomFeatures from '../familyswimup/components/RoomFeatures'
import RoomTour from '../familyswimup/components/RoomTour'
import OtherOptions from '../familyswimup/components/OtherOptions'
import ContactSection2 from '@/app/[locale]/GeneralComponents/Contact/ContactSection2'

import RoomsParallaxSection from '../components/RoomsParallaxSection'
import { getTranslations } from "next-intl/server";
import { readSitePageContent } from "@/lib/admin/site-pages";

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
    }));
}

const Page = async ({ params }) => {
  const { locale } = await params;
  const [t, t2, t3, media] = await Promise.all([
    getTranslations("SuperiorRoom"),
    getTranslations("SuperiorRoom.RoomInfo"),
    getTranslations("SuperiorRoom.RoomTour"),
    readSitePageContent("superiorroom"),
  ]);

  const subroomBannerText=[t("text1"),t("text2"),t("text3")]
  const iconTexts=[t2("list1"),t2("list2"),t2("list3")];

  const carouselImages = getLocalizedCollection(media.gallery, locale);

  return (
    <div className=' overflow-hidden flex flex-col items-center justify-center gap-[60px] md:gap-[80px] lg:gap-[100px] bg-[#fbfbfb]'>
     <div className='flex flex-col'>
     <SubRoomBanner img={getLocalizedImage(media.hero, locale)} span={t("subtitle")} header={t("title")} texts={subroomBannerText} baby={true}/>
     <SubroomCarousel images={carouselImages}/>
     </div>
      <RoomFeatures span={t2("subtitle")} header={t2("title")} text={t2("text")} header2={t2("title2")} header3={t2("title3")}  text2={t2("text2")} iconsTexts={iconTexts}  roomName="SuperiorRoom" pool={false}/>
      <RoomsParallaxSection/>
      <RoomTour span={t3("subtitle")} header={t3("title")} text={t3("text")} link="https://kuula.co/share/collection/7by5f?logo=1&info=0&fs=1&vr=1&autorotate=0.22&autop=10&autopalt=1&thumbs=4&margin=2&alpha=0.72"/>
      <RoomTour span={t3("subtitle2")} header={t3("title2")} text={t3("text2")} link="https://kuula.co/share/collection/7b230?logo=1&info=0&fs=1&vr=1&autorotate=0.22&autop=10&autopalt=1&thumbs=4&margin=2&alpha=0.72"/>
      <OtherOptions/>
      <ContactSection2/>
    </div>
  )
}

export default Page
