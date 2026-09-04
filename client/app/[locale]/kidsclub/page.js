import KidsBamboo from './components/KidsBamboo'
import KidsIconsSection from './components/KidsIconsSection'
import KidsclubCarousel from './components/KidsclubCarousel'
import CuisinesCarousel from '../restaurants/components/CuisinesCarousel'
import KidsRestaurantCarousel from './components/KidsRestaurantCarousel'
import KidsMomentCarousel from './components/KidsMomentCarousel'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2'
import RestaurantMainBanner from '../restaurants/components/RestaurantMainBanner'
import { getTranslations } from 'next-intl/server';
import { readSitePageContent } from '@/lib/admin/site-pages';

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
  const [t, t2, media] = await Promise.all([
    getTranslations('KidsClub'),
    getTranslations('KidsClub.CuisinesCarousel'),
    readSitePageContent('kidsclub'),
  ]);


const kids = [
  {
    id: 1,
    img: getLocalizedImage(media.pools.maldiva, locale),
    title: t2("cuisines1title"),
    description: t2("cuisines1subtitle"),
    text:t2("cuisines1text"),
    link:"/",
    buttonText:t2("buttonText")
  },
  {
    id: 2,
    img: getLocalizedImage(media.pools.aqua, locale),
    title: t2("cuisines2title"),
    description: t2("cuisines2subtitle"),
    text:t2("cuisines2text"),
     link:"/",
     buttonText:t2("buttonText")
  },
  {
    id: 3,
    img: getLocalizedImage(media.pools.indoor, locale),
    title: t2("cuisines3title"),
    description: t2("cuisines3subtitle"),
    text:t2("cuisines3text"),
     link:"/",
     buttonText:t2("buttonText")
  }
];

  return (
    <div className='overflow-hidden flex flex-col items-center justify-center gap-[60px] md:gap-[80px] lg:gap-[100px] bg-[#fbfbfb]'>
      <RestaurantMainBanner img={getLocalizedImage(media.hero, locale)} span={t("subtitle")} header={t("title")} text={t("text")}/>
      <KidsBamboo
        media={{
          decoration: getLocalizedImage(media.info.decoration, locale),
          clubs: {
            mini: getLocalizedImage(media.info.clubs.mini, locale),
            junior: getLocalizedImage(media.info.clubs.junior, locale),
            teenage: getLocalizedImage(media.info.clubs.teenage, locale),
          },
        }}
      />
      <KidsIconsSection/>
      <KidsclubCarousel
        images={Object.values(media.activities.items).map((image) =>
          getLocalizedImage(image, locale)
        )}
        indicator={getLocalizedImage(media.activities.indicator, locale)}
      />
      <KidsRestaurantCarousel images={getLocalizedCollection(media.restaurant, locale)}/>
      <CuisinesCarousel span={t2("subtitle")} header={t2("title")} text={t2("text")} cuisines={kids}/>
      <KidsMomentCarousel showheader={true} images={getLocalizedCollection(media.moments, locale)} header={t("gallerytitle")}/>
      <ContactSection2/>
    </div>
  )
}

export default Page
