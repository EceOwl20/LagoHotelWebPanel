import { getTranslations } from "next-intl/server";
import BannerDark from "@/app/[locale]/GeneralComponents/BannerDark";
import ContactSection2 from "@/app/[locale]/GeneralComponents/Contact/ContactSection2";
import KidsMomentCarousel from "@/app/[locale]/kidsclub/components/KidsMomentCarousel";
import { getRestaurantDetailConfigByPageKey } from "@/lib/admin/restaurant-detail-config.mjs";
import { readSitePageContent } from "@/lib/admin/site-pages";
import ClinaryReverseInfo from "./ClinaryReverseInfo";
import CuisinesCarousel from "./CuisinesCarousel";
import DiscoverBackground from "./DiscoverBackground";
import RestaurantMainBanner from "./RestaurantMainBanner";

const bannerComponents = {
  dark: BannerDark,
  main: RestaurantMainBanner,
};

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

export default async function RestaurantDetailPage({
  locale,
  pageKey,
  beforeInfo = null,
  afterInfo = null,
  afterGallery = null,
  beforeContact = null,
}) {
  const config = getRestaurantDetailConfigByPageKey(pageKey);

  if (!config) {
    throw new Error(`Desteklenmeyen restoran detay sayfası: ${pageKey}`);
  }

  const [t, infoTranslations, carouselTranslations, discoverTranslations, media, sharedMedia] =
    await Promise.all([
      getTranslations(config.namespace),
      getTranslations(`${config.namespace}.ClinaryInfoSection`),
      getTranslations(`${config.namespace}.CuisinesCarousel`),
      getTranslations(`${config.namespace}.DiscoverBackground`),
      readSitePageContent(config.pageKey),
      readSitePageContent("restaurants"),
    ]);
  const Banner = bannerComponents[config.bannerVariant];
  const otherOptions = [
    {
      id: 1,
      img: getLocalizedImage(sharedMedia.cuisines.anatolia, locale),
      title: carouselTranslations("cuisines1subtitle"),
      description: carouselTranslations("cuisines1title"),
      text: carouselTranslations("cuisines1text"),
      link: "/restaurants/anatoliarestaurant",
      buttonText: carouselTranslations("buttonText"),
    },
    {
      id: 2,
      img: getLocalizedImage(sharedMedia.detailOptions.wasabi, locale),
      title: carouselTranslations("cuisines2subtitle"),
      description: carouselTranslations("cuisines2title"),
      text: carouselTranslations("cuisines2text"),
      link: "/restaurants/wasabi",
      buttonText: carouselTranslations("buttonText"),
    },
    {
      id: 3,
      img: getLocalizedImage(sharedMedia.cuisines.despina, locale),
      title: carouselTranslations("cuisines3subtitle"),
      description: carouselTranslations("cuisines3title"),
      text: carouselTranslations("cuisines3text"),
      link: "/restaurants/despinarestaurant",
      buttonText: carouselTranslations("buttonText"),
    },
  ];
  const pageClassName = [
    "flex flex-col items-center justify-center gap-[60px] bg-[#fbfbfb] md:gap-[80px] lg:gap-[100px]",
    config.overflowHidden ? "overflow-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={pageClassName}>
      <Banner
        img={getLocalizedImage(media.hero, locale)}
        span={t("subtitle")}
        header={t("title")}
        text={t("text")}
      />
      {beforeInfo}
      <ClinaryReverseInfo
        img1={getLocalizedImage(media.info.primary, locale)}
        img2={getLocalizedImage(media.info.secondary, locale)}
        span={infoTranslations("subtitle")}
        header={infoTranslations("title")}
        text1={infoTranslations("text1")}
        text2={infoTranslations("text2")}
      />
      {afterInfo}
      <KidsMomentCarousel
        images={getLocalizedCollection(media.gallery, locale)}
        header=""
        showheader={false}
      />
      {afterGallery}
      <CuisinesCarousel
        span={carouselTranslations("subtitle")}
        header={carouselTranslations("title")}
        text={carouselTranslations("text")}
        cuisines={otherOptions}
      />
      <DiscoverBackground
        span={discoverTranslations("subtitle")}
        header={discoverTranslations("title")}
        text={discoverTranslations("text")}
        link={config.discoverLink}
        img={getLocalizedImage(sharedMedia.discover, locale)}
        buttonText={discoverTranslations("buttonText")}
      />
      {beforeContact}
      <ContactSection2 />
    </div>
  );
}
