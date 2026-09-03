import Image from "next/image";
import { getTranslations } from "next-intl/server";
import RestaurantMainBanner from "./components/RestaurantMainBanner";
import ClinaryInfoSection from "./components/ClinaryInfoSection";
import MainRestaurantSection from "./components/MainRestaurantSection";
import CuisinesCarousel from "./components/CuisinesCarousel";
import ClinaryReverseInfo from "./components/ClinaryReverseInfo";
import DiscoverBackground from "./components/DiscoverBackground";
import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";
import { readSitePageContent } from "@/lib/admin/site-pages";

function getLocalizedImage(item, locale) {
  return {
    src: item.image,
    alt: item.translations?.[locale]?.alt || "",
  };
}

const Page = async ({ params }) => {
  const { locale } = await params;
  const [t, t2, t3, t4, t5, t6, media] = await Promise.all([
    getTranslations("Restaurants"),
    getTranslations("Restaurants.ClinaryInfoSection"),
    getTranslations("Restaurants.CuisinesCarousel"),
    getTranslations("Restaurants.ClinaryReverseSection"),
    getTranslations("Restaurants.CuisinesCarousel2"),
    getTranslations("Restaurants.DiscoverBackground"),
    readSitePageContent("restaurants"),
  ]);

  const textsClinary = [t2("text1"), t2("text2"), t2("text3"), t2("text4")];
  const cuisines = [
    {
      id: 1,
      img: getLocalizedImage(media.cuisines.anatolia, locale),
      title: t3("cuisines1title"),
      description: t3("cuisines1subtitle"),
      text: t3("cuisines1text"),
      link: "restaurants/anatoliarestaurant",
      buttonText: t3("buttonText"),
    },
    {
      id: 2,
      img: getLocalizedImage(media.cuisines.gusto, locale),
      title: t3("cuisines2title"),
      description: t3("cuisines2subtitle"),
      text: t3("cuisines2text"),
      link: "/restaurants/gustorestaurant",
      buttonText: t3("buttonText"),
    },
    {
      id: 3,
      img: getLocalizedImage(media.cuisines.despina, locale),
      title: t3("cuisines3title"),
      description: t3("cuisines3subtitle"),
      text: t3("cuisines3text"),
      link: "/restaurants/despinarestaurant",
      buttonText: t3("buttonText"),
    },
  ];
  const cuisines2 = [
    {
      id: 1,
      img: getLocalizedImage(media.cuisinesSecondary.wasabi, locale),
      title: t5("cuisines1title"),
      description: t5("cuisines1subtitle"),
      text: t5("cuisines1text"),
      link: "restaurants/wasabi",
      buttonText: t5("buttonText"),
    },
    {
      id: 2,
      img: getLocalizedImage(media.cuisinesSecondary.fuego, locale),
      title: t5("cuisines2title"),
      description: t5("cuisines2subtitle"),
      text: t5("cuisines2text"),
      link: "/restaurants/fuego",
      buttonText: t5("buttonText"),
    },
    {
      id: 3,
      img: getLocalizedImage(media.cuisinesSecondary.tapaz, locale),
      title: t5("cuisines3title"),
      description: t5("cuisines3subtitle"),
      text: t5("cuisines3text"),
      link: "/restaurants/tapazrestaurant",
      buttonText: t5("buttonText"),
    },
  ];
  const decoration = getLocalizedImage(media.decoration, locale);

  return (
    <div className="overflow-hidden items-center justify-center flex flex-col gap-[60px] md:gap-[80px] lg:gap-[100px] bg-[#fbfbfb]">
      <RestaurantMainBanner img={getLocalizedImage(media.hero, locale)} span={t("subtitle")} header={t("title")} text={t("text")} />
      <ClinaryInfoSection img1={getLocalizedImage(media.culinaryInfo.primary, locale)} img2={getLocalizedImage(media.culinaryInfo.secondary, locale)} span={t2("subtitle")} header={t2("title")} texts={textsClinary} />
      <MainRestaurantSection image={getLocalizedImage(media.mainFeature, locale)} />
      <CuisinesCarousel span={t3("subtitle")} header={t3("title")} text={t3("text")} cuisines={cuisines} />
      <ClinaryReverseInfo img1={getLocalizedImage(media.reverseInfo.primary, locale)} img2={getLocalizedImage(media.reverseInfo.secondary, locale)} span={t4("subtitle")} header={t4("title")} text1={t4("text1")} text2={t4("text2")} />
      <div className="flex flex-col relative">
        <Image src={decoration.src} width={800} height={950} className="hidden lg:flex absolute right-0 w-[172px] h-[203px] sm:w-[252px] sm:h-[304px] md:w-[343px] md:h-[407px] top-0 md:-top-[12%] xl:right-[190px] lg:-top-[30%]" alt={decoration.alt || "Bistro dekoratif görseli"} />
        <CuisinesCarousel span={t5("subtitle")} header={t5("title")} text={t5("text")} cuisines={cuisines2} />
      </div>
      <DiscoverBackground span={t6("subtitle")} header={t6("title")} text={t6("text")} link="/barcafes" img={getLocalizedImage(media.discover, locale)} buttonText={t6("buttonText")} />
      <ContactSection2 />
    </div>
  );
};

export default Page;
