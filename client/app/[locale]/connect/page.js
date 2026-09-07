import React from 'react'
import Connect1 from "./components/Connect1.jsx"
import Connect2 from './components/Connect2.jsx'
import Connect3 from './components/Connect3.jsx'
import ContactSection2 from '../GeneralComponents/Contact/ContactSection2.jsx'
import HomePage6 from "../HomePage/Components/HomePage5.jsx"
import { readSitePageContent } from '@/lib/admin/site-pages'

function getLocalizedImage(item, locale) {
  return {
    src: item.image,
    alt: item.translations?.[locale]?.alt || "",
  };
}

const page = async ({ params }) => {
  const { locale } = await params;
  const media = await readSitePageContent('contact');

  return (
    <div className='flex flex-col items-center justify-center gap-[50px] lg:gap-[100px] bg-[#fbfbfb] overflow-hidden'>
      <Connect1 heroImage={getLocalizedImage(media.hero, locale)} />
      <Connect2 backgroundImage={getLocalizedImage(media.formBackground, locale)} />
      <Connect3 />
      <ContactSection2 />
      <HomePage6 />
    </div>
  )
}

export default page
