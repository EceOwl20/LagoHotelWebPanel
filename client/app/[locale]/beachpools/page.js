import Beach1 from './Components/Beach1'
import Beach2 from './Components/Beach2'
import Beach3 from './Components/Beach3'
import Beach4 from './Components/Beach4'
import Beach5 from './Components/Beach5'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2'
import Form from '../GeneralComponents/Form'
import BeachMobile from './Components/BeachMobile'
import ClinaryInfoSection from '../restaurants/components/ClinaryInfoSection'
import { getTranslations } from 'next-intl/server';
import { readSitePageContent } from '@/lib/admin/site-pages';

function getLocalizedImage(image, locale) {
  return {
    src: image.image,
    alt: image.translations?.[locale]?.alt || "",
  };
}

const Page = async ({ params }) => {
  const { locale } = await params;
  const [t, t2, media] = await Promise.all([
    getTranslations('BeachPools.ClinaryInfoSection'),
    getTranslations('BeachPools.PoolList'),
    readSitePageContent('beachpools'),
  ]);

  const texts = [
    t("text1"),
    t("text2"),
    t("text3"),
    t("text4"),
    t("text5")
  ];


const poolItems = [
  {
    src: getLocalizedImage(media.pools.main.image, locale),
    hoverSrc: getLocalizedImage(media.pools.main.hover, locale),
    subtitle: t2("poolSubTitle1"),
    title: t2("poolTitle1"),
    description: t2("poolText1"),
  },
  {
    src: getLocalizedImage(media.pools.relax.image, locale),
    hoverSrc: getLocalizedImage(media.pools.relax.hover, locale),
    subtitle: t2("poolSubTitle2"),
    title: t2("poolTitle2"),
    description: t2("poolText2"),
  },
  {
    src: getLocalizedImage(media.pools.maldiva.image, locale),
    hoverSrc: getLocalizedImage(media.pools.maldiva.hover, locale),
    subtitle: t2("poolSubTitle3"),
    title: t2("poolTitle3"),
    description: t2("poolText3"),
  },
  {
    src: getLocalizedImage(media.pools.infinity.image, locale),
    hoverSrc: getLocalizedImage(media.pools.infinity.hover, locale),
    subtitle: t2("poolSubTitle4"),
    title: t2("poolTitle4"),
    description: t2("poolText4"),
  },
  {
    src: getLocalizedImage(media.pools.maldivaKids.image, locale),
    hoverSrc: getLocalizedImage(media.pools.maldivaKids.hover, locale),
    subtitle: t2("poolSubTitle5"),
    title:t2("poolTitle5"),
    description: t2("poolText5"),
  },
  {
    src: getLocalizedImage(media.pools.indoor.image, locale),
    hoverSrc: getLocalizedImage(media.pools.indoor.hover, locale),
    subtitle:t2("poolSubTitle6"),
    title: t2("poolTitle6"),
    description: t2("poolText6"),
  },
  {
    src: getLocalizedImage(media.pools.aqua.image, locale),
    hoverSrc: getLocalizedImage(media.pools.aqua.hover, locale),
    subtitle: t2("poolSubTitle7"),
    title: t2("poolTitle7"),
    description: t2("poolText7"),
  },
  {
    src: getLocalizedImage(media.pools.kidsAqua.image, locale),
    hoverSrc: getLocalizedImage(media.pools.kidsAqua.hover, locale),
    subtitle: t2("poolSubTitle8"),
    title: t2("poolTitle8"),
    description: t2("poolText8"), 
  },
  {
    src: getLocalizedImage(media.pools.megaAqua.image, locale),
    hoverSrc: getLocalizedImage(media.pools.megaAqua.hover, locale),
    subtitle: t2("poolSubTitle9"),
    title: t2("poolTitle9"),
    description: t2("poolText9"),
  },
]
  

  return (
    <div className='overflow-hidden overflow-y-hidden bg-[#fbfbfb]'>
      <Beach1
        media={{
          desktopBackground: getLocalizedImage(media.hero.desktopBackground, locale),
          titleGraphic: getLocalizedImage(media.hero.titleGraphic, locale),
          wave: getLocalizedImage(media.hero.wave, locale),
          info: {
            primary: getLocalizedImage(media.info.primary, locale),
            secondary: getLocalizedImage(media.info.secondary, locale),
          },
        }}
      />
     <div className='flex w-screen flex-col items-center justify-center gap-[60px] md:gap-[80px] lg:gap-[100px] lg:mt-[100px] bg-[#fbfbfb]'>
     <BeachMobile image={getLocalizedImage(media.hero.mobileBackground, locale)}/>
    <div className='flex lg:hidden'>
    <ClinaryInfoSection
            img1={getLocalizedImage(media.info.primary, locale)}
            img2={getLocalizedImage(media.info.secondary, locale)}
            span={t("subtitle")}
            header={t("title")}
            texts={texts}
          />
    </div>
     <Beach2 image={getLocalizedImage(media.cabanaBackground, locale)} />
      <Beach3
        images={{
          activity1: getLocalizedImage(media.activities.activity1, locale),
          activity2: getLocalizedImage(media.activities.activity2, locale),
          activity3: getLocalizedImage(media.activities.activity3, locale),
          activity4: getLocalizedImage(media.activities.activity4, locale),
        }}
      />
      <Beach4 />
      <Beach5 id="pools" showLink={false} span={t2("subtitle")} header={t2("title")} text={t2("text")} poolItems={poolItems}/>
      <ContactSection2 />
      <Form/>
     </div>
    </div>
  )
}

export default Page
