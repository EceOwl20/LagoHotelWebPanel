import { getTranslations } from "next-intl/server";
import BannerDark from "@/app/[locale]/GeneralComponents/BannerDark";
import ContactSection2 from "@/app/[locale]/GeneralComponents/Contact/ContactSection2";
import KidsMomentCarousel from "@/app/[locale]/kidsclub/components/KidsMomentCarousel";
import ClinaryReverseInfo from "@/app/[locale]/restaurants/components/ClinaryReverseInfo";
import DiscoverBackground from "@/app/[locale]/restaurants/components/DiscoverBackground";
import RestaurantMainBanner from "@/app/[locale]/restaurants/components/RestaurantMainBanner";
import { getBarCafeDetailConfigByPageKey } from "@/lib/admin/bar-cafe-detail-config.mjs";
import { readSitePageContent } from "@/lib/admin/site-pages";
import OtherOptions4 from "./OtherOptions4";

const bannerComponents = {
  dark: BannerDark,
  main: RestaurantMainBanner,
};

const relatedGroups = {
  bars: [
    { key: "mignon", link: "/barcafes/mignonbar" },
    { key: "joie", link: "/barcafes/joiebar" },
    { key: "maldiva", link: "/barcafes/maldivabar" },
    { key: "vago", link: "/barcafes/vagobar" },
  ],
  cafes: [
    { key: "piano", link: "/barcafes/pianobar" },
    { key: "abella", link: "/barcafes/abellapatisserie" },
    { key: "lago", link: "/barcafes/cafedelago" },
    { key: "house", link: "/barcafes/cafedehouse" },
  ],
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

export default async function BarCafeDetailPage({ locale, pageKey }) {
  const config = getBarCafeDetailConfigByPageKey(pageKey);

  if (!config) {
    throw new Error(`Desteklenmeyen bar veya kafe detay sayfası: ${pageKey}`);
  }

  const [t, infoTranslations, carouselTranslations, discoverTranslations, media, sharedMedia] =
    await Promise.all([
      getTranslations(config.namespace),
      getTranslations(`${config.namespace}.ClinaryInfoSection`),
      getTranslations(`${config.namespace}.CuisinesCarousel`),
      getTranslations(`${config.namespace}.DiscoverBackground`),
      readSitePageContent(config.pageKey),
      readSitePageContent("barcafes"),
    ]);
  const Banner = bannerComponents[config.bannerVariant];
  const optionDefinitions = relatedGroups[config.relatedGroup];
  const otherOptions = optionDefinitions.map((option, index) => {
    const number = index + 1;

    return {
      id: number,
      img: getLocalizedImage(sharedMedia[config.relatedGroup][option.key], locale),
      title: carouselTranslations(`cuisines${number}title`),
      description: carouselTranslations(`cuisines${number}subtitle`),
      text: carouselTranslations(
        config.relatedTextKeys?.[index] || `cuisines${number}text`
      ),
      link: config.relatedLinks?.[index] || option.link,
      buttonText: carouselTranslations("buttonText"),
    };
  });

  return (
    <div className={config.pageClassName}>
      <Banner
        img={getLocalizedImage(media.hero, locale)}
        span={t("subtitle")}
        header={t("title")}
        text={t("text")}
      />
      <ClinaryReverseInfo
        img1={getLocalizedImage(media.info.primary, locale)}
        img2={getLocalizedImage(media.info.secondary, locale)}
        span={infoTranslations("subtitle")}
        header={infoTranslations("title")}
        text1={infoTranslations("text1")}
        text2={infoTranslations("text2")}
      />
      <KidsMomentCarousel
        images={getLocalizedCollection(media.gallery, locale)}
        header=""
        showheader={false}
      />
      <OtherOptions4
        span={carouselTranslations("subtitle")}
        header={carouselTranslations(config.relatedHeaderKey)}
        text={carouselTranslations("text")}
        images={otherOptions}
      />
      <DiscoverBackground
        span={discoverTranslations("subtitle")}
        header={discoverTranslations(config.discoverHeaderKey)}
        text={discoverTranslations("text")}
        link={config.discoverLink}
        img={getLocalizedImage(sharedMedia.discover, locale)}
        buttonText={discoverTranslations("buttonText")}
      />
      <ContactSection2 />
    </div>
  );
}
