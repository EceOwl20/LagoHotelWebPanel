import MainBannerSection from '../GeneralComponents/MainBannerSection'
import SpaInfoSection from '../spawellness/components/SpaInfoSection'
import SpaHeaderSection from '../spawellness/components/SpaHeaderSection'
import MassageCarousel from '../spawellness/components/MassageCarousel'
import SpaTypesInfoSection from '../spawellness/components/SpaTypesInfoSection'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2'
import { getTranslations } from 'next-intl/server'
import { readSitePageContent } from '@/lib/admin/site-pages'

function getLocalizedImage(image, locale) {
  return {
    src: image.image,
    alt: image.translations?.[locale]?.alt || "",
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
    getTranslations({ locale, namespace: 'Fitness' }),
    getTranslations({ locale, namespace: 'Fitness.InfoSection' }),
    getTranslations({ locale, namespace: 'Fitness.SpaGallery' }),
    getTranslations({ locale, namespace: 'Fitness.Carousel' }),
    getTranslations({ locale, namespace: 'Fitness.SpaType' }),
    readSitePageContent('fitness'),
  ]);

const texts=[t2("subtitle"),t2("title"),t2("text")]
const texts2=[t2("subtitle2"),t2("title2"),t2("text2")]
const texts3=[t2("subtitle3"),t2("title3"),t2("text3"),t2("list1"),t2("list2"),t2("list3"),t2("list4"),t2("list5")]
const activitiesHeaders=[t4("massage1"),t4("massage2"),t4("massage3"),t4("massage4")]

  return (
    <div className='flex flex-col items-center justify-center gap-[100px] bg-[#fbfbfb] overflow-hidden'>
      <MainBannerSection img={getLocalizedImage(media.hero, locale)} span={t("subtitle")} header={t("title")} text={t("text")}/>
      <SpaInfoSection img1={getLocalizedImage(media.info.primary, locale)} img2={getLocalizedImage(media.info.secondary, locale)} texts={texts} texts2={texts2} texts3={texts3}/>
      <SpaHeaderSection span={t3("subtitle")} header={t3("title")} text={t3("text")} images={getLocalizedCollection(media.gallery, locale)}/>
      <MassageCarousel span={t4("subtitle")} header={t4("title")} text={t4("text")} images={getLocalizedCollection(media.activities, locale)} headers={activitiesHeaders}/>
      <SpaTypesInfoSection isImageLeft={true} showLink={false} span={t5("subtitle")} header={t5("title")} text={t5("text")} img={getLocalizedImage(media.features.beachVolley, locale)}/>
      <SpaTypesInfoSection isImageLeft={false} showLink={false} span={t5("subtitle2")} header={t5("title2")} text={t5("text2")} img={getLocalizedImage(media.features.personalTraining, locale)}/>
      <ContactSection2/>
    </div>
  )
}

export default Page
