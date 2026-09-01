import React from 'react'
import MainBanner2 from '../GeneralComponents/MainBanner2'
import CertificateSection1 from './components/CertificateSection1'
import Certificate from './components/Certificate'
import { getTranslations } from 'next-intl/server'
import { readSitePageContent } from '@/lib/admin/site-pages'

const Page = async () => {
  const [t, media] = await Promise.all([
    getTranslations('Certificates'),
    readSitePageContent('certificates'),
  ])

  return (
    <div className='flex flex-col items-center justify-center gap-[50px] md:gap-[75px] lg:gap-[100px] overflow-hidden'>
      <MainBanner2
        img={media.hero.image}
        span={t('hero.eyebrow')}
        header={t('hero.title')}
        opacity={true}
      />
      <CertificateSection1
        image={media.feature.image}
        eyebrow={t('feature.eyebrow')}
        title={t('feature.title')}
        text={t('feature.text')}
      />
      <Certificate title={t('gallery.title')} images={media.gallery.images}/>
    </div>
  )
}

export default Page
