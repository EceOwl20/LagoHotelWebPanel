import RoomsBanner from "./components/RoomsBanner";
import RoomsInfoSection from "./components/RoomsInfoSection";
import RoomsSection from "./components/RoomsSection";
import RoomsSectionReverse from "./components/RoomsSectionReverse";
import RoomsParallaxSection from "./components/RoomsParallaxSection";

import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";
import { getTranslations } from "next-intl/server";
import { readSitePageContent } from "@/lib/admin/site-pages";

function getLocalizedImage(item, locale) {
  return {
    src: item.image,
    alt: item.translations?.[locale]?.alt || "",
  };
}

const Page = async ({ params }) => {
  const { locale } = await params;
  const [room1, room2, room3, room4, room5, room7, media] = await Promise.all([
    getTranslations("Accommodation.RoomSection1"),
    getTranslations("Accommodation.RoomSection2"),
    getTranslations("Accommodation.RoomSection3"),
    getTranslations("Accommodation.RoomSection4"),
    getTranslations("Accommodation.RoomSection5"),
    getTranslations("Accommodation.RoomSection7"),
    readSitePageContent("rooms"),
  ]);

  const image = (item) => getLocalizedImage(item, locale);

  return (
    <div className="overflow-hidden flex flex-col items-center justify-center gap-[50px] lg:gap-[100px] bg-[#fbfbfb]">
      <RoomsBanner image={image(media.hero)} />
      <RoomsInfoSection />
      <RoomsSection
      id="superiorroom"
        img={image(media.cards.superior.primary)}
        img2={image(media.cards.superior.secondary)}
        header={room1('title')}
        text={room1('subtitle')}
         span={room1('m')}
        span2={room1('view')}
        buttonText={room1('buttonText')}
        link="/rooms/superiorroom" 
      />
      <RoomsSectionReverse
      id="familyroom"
        img={image(media.cards.family.primary)}
        img2={image(media.cards.family.secondary)}
        header={room2('title')}
        text={room2('subtitle')}
         span={room2('m')}
        span2={room2('view')}
        buttonText={room2('buttonText')}
        link="/rooms/familyroom" 
      />

      <RoomsSection
      id="swimuproom"
        img={image(media.cards.swimup.primary)}
        img2={image(media.cards.swimup.secondary)}
        header={room3('title')}
        text={room3('subtitle')}
         span={room3('m')}
        span2={room3('view')}
        buttonText={room3('buttonText')}
        link="/rooms/swimuproom" 
      />
      <RoomsSectionReverse
       id="familyswimup"
        img={image(media.cards.familySwimup.primary)}
        img2={image(media.cards.familySwimup.secondary)}
        header={room4('title')}
        text={room4('subtitle')}
         span={room4('m')}
        span2={room4('view')}
        buttonText={room4('buttonText')}
        link="/rooms/familyswimup" 
      />

      <RoomsSection
      id="duplexfamilyroom"
        img={image(media.cards.duplexFamily.primary)}
        img2={image(media.cards.duplexFamily.secondary)}
        header={room5('title')}
        text={room5('subtitle')}
         span={room5('m')}
        span2={room5('view')}
        buttonText={room5('buttonText')}
        link="/rooms/duplexfamilyroom" 
      />

      <RoomsSectionReverse
      id="disableroom"
        img={image(media.cards.disabled.primary)}
        img2={image(media.cards.disabled.secondary)}
        header={room7('title')}
        text={room7('subtitle')}
         span={room7('m')}
        span2={room7('view')}
        buttonText={room7('buttonText')}
        link="/rooms/disableroom" 
      /> 

     

      <RoomsParallaxSection image={image(media.parallax)} />
      <ContactSection2/>
    </div>
  );
};

export default Page;
