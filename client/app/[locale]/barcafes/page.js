import { getTranslations } from "next-intl/server";
import ClinaryInfoSection from "../restaurants/components/ClinaryInfoSection";
import DiscoverBackground from "../restaurants/components/DiscoverBackground";
import BackgroundSection from "../rooms/familyswimup/components/BackgroundSection";
import BarCarouselSection from "./components/BarCarouselSection";
import OtherOptions4 from "./components/OtherOptions4";
import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";
import RestaurantMainBanner from "../restaurants/components/RestaurantMainBanner";
import { readSitePageContent } from "@/lib/admin/site-pages";

function getLocalizedImage(item, locale) {
  return {
    src: item.image,
    alt: item.translations?.[locale]?.alt || "",
  };
}

function getLocalizedCollection(collection, locale) {
  return collection.images.map((item) => ({
    id: item.id,
    src: item.src,
    alt: item.translations?.[locale]?.alt || "",
  }));
}

const Page = async ({ params }) => {
  const { locale } = await params;
  const [t, t2, t3, t4, t5, t6, t7, media] = await Promise.all([
    getTranslations("BarAndCafes"),
    getTranslations("BarAndCafes.ClinaryInfoSection"),
    getTranslations("BarAndCafes.BarImageSection"),
    getTranslations("BarAndCafes.CuisinesCarousel"),
    getTranslations("BarAndCafes.BarImageSection2"),
    getTranslations("BarAndCafes.CuisinesCarousel2"),
    getTranslations("BarAndCafes.DiscoverBackground"),
    readSitePageContent("barcafes"),
  ]);

  const otherOptions = [
    { id: 1, img: getLocalizedImage(media.bars.mignon, locale), title: t4("cuisines1title"), description: t4("cuisines1subtitle"), text: t4("cuisines1text"), link: "/barcafes/mignonbar", buttonText: t4("buttonText") },
    { id: 2, img: getLocalizedImage(media.bars.joie, locale), title: t4("cuisines2title"), description: t4("cuisines2subtitle"), text: t4("cuisines2text"), link: "/barcafes/joiebar", buttonText: t4("buttonText") },
    { id: 3, img: getLocalizedImage(media.bars.maldiva, locale), title: t4("cuisines3title"), description: t4("cuisines3subtitle"), text: t4("cuisines3text"), link: "/barcafes/maldivabar", buttonText: t4("buttonText") },
    { id: 4, img: getLocalizedImage(media.bars.vago, locale), title: t4("cuisines4title"), description: t4("cuisines4subtitle"), text: t4("cuisines4text"), link: "/barcafes/vagobar", buttonText: t4("buttonText") },
  ];

  const otherOptions2 = [
    { id: 1, img: getLocalizedImage(media.cafes.piano, locale), title: t6("cuisines1title"), description: t6("cuisines1subtitle"), text: t6("cuisines1text"), link: "/barcafes/pianobar", buttonText: t6("buttonText") },
    { id: 2, img: getLocalizedImage(media.cafes.abella, locale), title: t6("cuisines2title"), description: t6("cuisines2subtitle"), text: t6("cuisines2text"), link: "/barcafes/abellapatisserie", buttonText: t6("buttonText") },
    { id: 3, img: getLocalizedImage(media.cafes.lago, locale), title: t6("cuisines3title"), description: t6("cuisines3subtitle"), text: t6("cuisines3text"), link: "/barcafes/cafedelago", buttonText: t6("buttonText") },
    { id: 4, img: getLocalizedImage(media.cafes.house, locale), title: t6("cuisines4title"), description: t6("cuisines4subtitle"), text: t6("cuisines4text"), link: "/barcafes/cafedehouse", buttonText: t6("buttonText") },
  ];

  const clinaryTexts = [t2("text1")];
  const backgroundTexts = [t3("text")];
  const backgroundTexts2 = [t5("text1")];

  return (
    <div className="flex flex-col items-center justify-center gap-[60px] overflow-hidden bg-[#fbfbfb] md:gap-[80px] lg:gap-[100px]">
      <RestaurantMainBanner img={getLocalizedImage(media.hero, locale)} span={t("subtitle")} header={t("title")} text={t("text")} />
      <ClinaryInfoSection img1={getLocalizedImage(media.culinaryInfo.primary, locale)} img2={getLocalizedImage(media.culinaryInfo.secondary, locale)} span={t2("subtitle")} header={t("title")} texts={clinaryTexts} />
      <BackgroundSection span={t3("subtitle")} header={t3("title")} texts={backgroundTexts} link="/barcafes/mignonbar" img={getLocalizedImage(media.featureBackgrounds.bars, locale)} buttonText={t3("title")} />
      <OtherOptions4 span={t4("subtitle")} header={t4("title")} text={t4("text")} images={otherOptions} />
      <BackgroundSection span={t5("subtitle")} header={t5("title")} texts={backgroundTexts2} link="/" img={getLocalizedImage(media.featureBackgrounds.cafes, locale)} />
      <OtherOptions4 span={t6("subtitle")} header={t6("title")} text={t6("text")} images={otherOptions2} />
      <BarCarouselSection images={getLocalizedCollection(media.carousel, locale)} />
      <DiscoverBackground span={t7("subtitle")} header={t7("title")} text={t7("text")} link="/barcafes" img={getLocalizedImage(media.discover, locale)} buttonText={t7("buttonText")} />
      <ContactSection2 />
    </div>
  );
};

export default Page;
