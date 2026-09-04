import MainBannerSection from './components/MainBannerSection'
import ActivitiesSection from './components/ActivitiesSection'
import EntertainmentTypesSection from './components/EntertainmentTypesSection'
import ActivityBackgroundSection from './components/ActivityBackgroundSection'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2'
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

const page = async ({ params }) => {
  const { locale } = await params;
  const media = await readSitePageContent('entertainment');

  return (
    <div className='flex flex-col items-center justify-center gap-[60px] md:gap-[80px] lg:gap-[100px] bg-[#fbfbfb]'>
      <MainBannerSection img={getLocalizedImage(media.hero, locale)}/>
      <ActivitiesSection
        images={{
          daytime: getLocalizedImage(media.info.daytime, locale),
          nighttime: getLocalizedImage(media.info.nighttime, locale),
        }}
      />
      <EntertainmentTypesSection
        images={{
          fitness: getLocalizedImage(media.activities.fitness, locale),
          kids: getLocalizedImage(media.activities.kids, locale),
          water: getLocalizedImage(media.activities.water, locale),
          beachVolley: getLocalizedImage(media.activities.beachVolley, locale),
          sunset: getLocalizedImage(media.activities.sunset, locale),
          stage: getLocalizedImage(media.activities.stage, locale),
          themed: getLocalizedImage(media.activities.themed, locale),
        }}
      />
      <ActivityBackgroundSection images={getLocalizedCollection(media.gallery, locale)}/>
      <ContactSection2/>
    </div>
  )
}

export default page
