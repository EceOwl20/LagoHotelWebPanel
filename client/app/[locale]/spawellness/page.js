import SpaInfoSection from "./components/SpaInfoSection";
import SpaHeaderSection from "./components/SpaHeaderSection";
import MassageCarousel from "./components/MassageCarousel";
import SpaTypesInfoSection from "./components/SpaTypesInfoSection";
import SpaReverse from "./components/SpaReverse";
import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";
import RestaurantMainBanner from "../restaurants/components/RestaurantMainBanner";
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
  const [t, t2, t3, t4, t5, media] = await Promise.all([
    getTranslations("Spa"),
    getTranslations("Spa.InfoSection"),
    getTranslations("Spa.SpaGallery"),
    getTranslations("Spa.Carousel"),
    getTranslations("Spa.SpaType"),
    readSitePageContent("spawellness"),
  ]);

  const spaTextsInfo1 = [t2("subtitle"), t2("title"), t2("text")];
  const spaTextsInfo2 = [t2("subtitle2"), t2("title2"), t2("text2")];
  const spaTextsInfo3 = [
    t2("subtitle3"),
    t2("title3"),
    t2("text3"),
    t2("list1"),
    t2("list2"),
    t2("list3"),
    t2("list4"),
    t2("list5"),
  ];
  const massageHeaders = [
    t4("massage1"),
    t4("massage2"),
    t4("massage3"),
    t4("massage4"),
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-[60px] overflow-hidden bg-[#fbfbfb] md:gap-[80px] lg:gap-[100px]">
      <RestaurantMainBanner
        span={t("subtitle")}
        header={t("title")}
        text={t("text")}
        img={getLocalizedImage(media.hero, locale)}
      />
      <SpaInfoSection
        img1={getLocalizedImage(media.info.wellness, locale)}
        img2={getLocalizedImage(media.info.sauna, locale)}
        texts={spaTextsInfo1}
        texts2={spaTextsInfo2}
        texts3={spaTextsInfo3}
      />
      <SpaHeaderSection
        span={t3("subtitle")}
        header={t3("title")}
        text={t3("text")}
        images={getLocalizedCollection(media.gallery, locale)}
      />
      <MassageCarousel
        span={t4("subtitle")}
        header={t4("title")}
        text={t4("text")}
        headers={massageHeaders}
        images={getLocalizedCollection(media.massage, locale)}
      />
      <div className="flex flex-col gap-[40px] lg:gap-[50px]">
        <SpaTypesInfoSection
          span={t5("subtitle")}
          header={t5("title")}
          text={t5("text")}
          isImageLeft
          showLink={false}
          img={getLocalizedImage(media.types.indoor, locale)}
          buttonText={t5("buttonText")}
        />
        <SpaReverse
          isImageLeft={false}
          showLink={false}
          span={t5("subtitle2")}
          header={t5("title2")}
          text={t5("text2")}
          img={getLocalizedImage(media.types.turkishBath, locale)}
        />
      </div>
      <ContactSection2 />
    </div>
  );
};

export default Page;
