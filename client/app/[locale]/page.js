import React from 'react'
import  HomePage  from './HomePage/HomePage'
import { readSitePageContent } from '@/lib/admin/site-pages'

const page = async ({ params }) => {
  const { locale } = await params;
  const media = await readSitePageContent('homepage');

  return (
    <div className='overflow-hidden'>
      <HomePage media={media} locale={locale} />
    </div>
  )
}

export default page
