import SpecialTypesSection from './components/SpecialTypesSection'
import SpecialGridSection from './components/SpecialGridSection'
import SpecialInfoSection from './components/SpecialInfoSection'
import SpecialCarousel from './components/SpecialCarousel'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2'
import BannerDark from '../GeneralComponents/BannerDark'
import {getTranslations} from 'next-intl/server';
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
  const [t, media] = await Promise.all([
    getTranslations({ locale, namespace: 'Special' }),
    readSitePageContent('special'),
  ]);

  return (
    <div className='flex flex-col items-center justify-center gap-[60px] md:gap-[80px]  lg:gap-[100px] bg-[#fbfbfb] overflow-hidden'>
      <BannerDark span={t("subtitle")} header={t("title")} text={t("text")} img={getLocalizedImage(media.hero, locale)}/>
      <SpecialTypesSection images={Object.fromEntries(Object.entries(media.concepts).map(([key, image]) => [key, getLocalizedImage(image, locale)]))}/>
      <SpecialGridSection images={Object.fromEntries(Object.entries(media.cards).map(([key, image]) => [key, getLocalizedImage(image, locale)]))}/>
      <SpecialInfoSection images={Object.fromEntries(Object.entries(media.info).map(([key, image]) => [key, getLocalizedImage(image, locale)]))}/>
      <SpecialCarousel images={getLocalizedCollection(media.gallery, locale)}/>
      <ContactSection2/>
    </div>
  )
}

export default Page
