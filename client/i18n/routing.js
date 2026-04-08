import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['tr', 'en','de', 'ru'],
 
  // Used when no locale matches
  defaultLocale: 'tr',
  localeDetection: true,
  localePrefix : "always",
   pathnames : {
    "/": {
      en: "/",
      tr: "/",
      de: "/",
      ru: "/",
    },
  
    "/connect": {
      en: "/contact",
      tr: "/iletisim",
      de: "/kontakt",
      ru: "/kontakty",
    },

  
    "/beachpools": {
      en: "/beach-pool",
      tr: "/plaj-havuz",
      de: "/strand-pool",
      ru: "/plazh-basseyn",
    },
  
    "/rooms": {
      en: "/rooms",
      tr: "/odalar",
      de: "/zimmer",
      ru: "/nomera",
    },
  
    "/rooms/superiorroom": {
      en: "/rooms/superior-room",
      tr: "/odalar/superioroda",
      de: "/zimmer/superiorzimmer",
      ru: "/nomera/superior-nomer",
    },
  
    "/rooms/duplexfamilyroom": {
      en: "/rooms/duplex-family-room",
      tr: "/odalar/dupleksaileoda",
      de: "/zimmer/duplex-familienzimmer",
      ru: "/nomera/dupleks-semeynyi-nomer",
    },
  
    "/rooms/familyroom": {
      en: "/rooms/family-room",
      tr: "/odalar/aileoda",
      de: "/zimmer/familienzimmer",
      ru: "/nomera/semeynyi-nomer",
    },
  
    "/rooms/familyswimuproom": {
      en: "/rooms/family-swim-up-room",
      tr: "/odalar/ailehavuzluoda",
      de: "/zimmer/familienzimmer-mit-poolzugang",
      ru: "/nomera/semeynyi-nomer-s-basseynom",
    },
  
    "/rooms/swimuproom": {
      en: "/rooms/swim-up-room",
      tr: "/odalar/havuzluoda",
      de: "/zimmer/poolzimmer",
      ru: "/nomera/komnata-s-basseynom",
    },
  
    "/rooms/disableroom": {
      en: "/rooms/disabled-room",
      tr: "/odalar/engellioda",
      de: "/zimmer/barrierefreies-zimmer",
      ru: "/nomera/komnata-dlya-invalidov",
    },
  
    "/rooms/tinyvilla": {
      en: "/rooms/tiny-villa",
      tr: "/odalar/kucukvilla",
      de: "/zimmer/kleine-villa",
      ru: "/nomera/mini-villa",
    },
  
    "/about": {
      en: "/about",
      tr: "/hakkimizda",
      de: "/uber-uns",
      ru: "/o-nas",
    },
  
    "/barcafes": {
      en: "/bar-cafes",
      tr: "/bar-kafeler",
      de: "/bars-und-cafes",
      ru: "/bary-i-kafe",
    },

    "/barcafes/abellapatisserie": {
      en: "/barcafes/abellapatisserie",
      tr: "/bar-kafeler/abellapatisserie",
      de: "/bars-und-cafes/abellapatisserie",
      ru: "/bary-i-kafe/abellapatisserie",
    },

    "/barcafes/cafedehouse": {
      en: "/barcafes/cafedehouse",
      tr: "/bar-kafeler/cafedehouse",
      de: "/bars-und-cafes/cafedehouse",
      ru: "/bary-i-kafe/cafedehouse",
    },

    "/barcafes/cafedelago": {
      en: "/barcafes/cafedelago",
      tr: "/bar-kafeler/cafedelago",
      de: "/bars-und-cafes/cafedelago",
      ru: "/bary-i-kafe/cafedelago",
    },

    "/barcafes/joiebar": {
      en: "/barcafes/joiebar",
      tr: "/bar-kafeler/joiebar",
      de: "/bars-und-cafes/joiebar",
      ru: "/bary-i-kafe/joiebar",
    },
    
    "/barcafes/maldivabar": {
      en: "/barcafes/maldivabar",
      tr: "/bar-kafeler/maldivabar",
      de: "/bars-und-cafes/maldivabar",
      ru: "/bary-i-kafe/maldivabar",
    },

    "/barcafes/mignonbar": {
      en: "/barcafes/mignonbar",
      tr: "/bar-kafeler/mignonbar",
      de: "/bars-und-cafes/mignonbar",
      ru: "/bary-i-kafe/mignonbar",
    },

    "/barcafes/pianobar": {
      en: "/barcafes/pianobar",
      tr: "/bar-kafeler/pianobar",
      de: "/bars-und-cafes/pianobar",
      ru: "/bary-i-kafe/pianobar",
    },

    "/barcafes/vagobar": {
      en: "/barcafes/vagobar",
      tr: "/bar-kafeler/vagobar",
      de: "/bars-und-cafes/vagobar",
      ru: "/bary-i-kafe/vagobar",
    },
  
  
  
    "/entertainment": {
      en: "/entertainment",
      tr: "/eglence",
      de: "/unterhaltung",
      ru: "/razvlecheniya",
    },
  
    "/certificates": {
      en: "/certificates",
      tr: "/sertifikalar",
      de: "/zertifikate",
      ru: "/sertifikaty",
    },
  
    "/gallery": {
      en: "/gallery",
      tr: "/galeri",
      de: "/galerie",
      ru: "/galereya",
    },
  
    "/kidsclub": {
      en: "/kids-club",
      tr: "/cocuk-kulubu",
      de: "/kinderclub",
      ru: "/detskiy-klub",
    },
  
    "/news": {
      en: "/news",
      tr: "/haberler",
      de: "/nachrichten",
      ru: "/novosti",
    },

    "/news/[slug]": {
      en: "/news/[slug]",
      tr: "/haberler/[slug]",
      de: "/nachrichten/[slug]",
      ru: "/novosti/[slug]",
    },
  
    "/ourpolicies": {
      en: "/our-policies",
      tr: "/politikalarimiz",
      de: "/unsere-richtlinien",
      ru: "/nashi-politiki",
    },
  
    "/restaurants": {
      en: "/restaurants",
      tr: "/restoranlar",
      de: "/restaurants",
      ru: "/restorany",
    },

    "/restaurants/anatoliarestaurant": {
      en: "/restaurants/anatoliarestaurant",
      tr: "/restoranlar/anatoliarestaurant",
      de: "/restaurants/anatoliarestaurant",
      ru: "/restorany/anatoliarestaurant",
    },
  

    "/restaurants/despinarestaurant": {
      en: "/restaurants/despinarestaurant",
      tr: "/restoranlar/despinarestaurant",
      de: "/restaurants/despinarestaurant",
      ru: "/restorany/despinarestaurant",
    },

    
    "/restaurants/fuego": {
      en: "/restaurants/fuego",
      tr: "/restoranlar/fuego",
      de: "/restaurants/fuego",
      ru: "/restorany/fuego",
    },

        
    "/restaurants/gustorestaurants": {
      en: "/restaurants/gustorestaurants",
      tr: "/restoranlar/gustorestaurants",
      de: "/restaurants/gustorestaurants",
      ru: "/restorany/gustorestaurants",
    },

    "/restaurants/mainrestaurant": {
      en: "/restaurants/mainrestaurant",
      tr: "/restoranlar/mainrestaurant",
      de: "/restaurants/mainrestaurant",
      ru: "/restorany/mainrestaurant",
    },

    "/restaurants/tapazrestaurant": {
      en: "/restaurants/tapazrestaurant",
      tr: "/restoranlar/tapazrestaurant",
      de: "/restaurants/tapazrestaurant",
      ru: "/restorany/tapazrestaurant",
    },

    "/restaurants/wasabi": {
      en: "/restaurants/wasabi",
      tr: "/restoranlar/wasabi",
      de: "/restaurants/wasabi",
      ru: "/restorany/wasabi",
    },
  
    "/spawellness": {
      en: "/spa-wellness",
      tr: "/spa-wellness",
      de: "/spa-und-wellness",
      ru: "/spa-i-ozdorovlenie",
    },
  
    "/special": {
      en: "/special",
      tr: "/ozel",
      de: "/spezial",
      ru: "/spetsial",
    },
  
    "/sport": {
      en: "/sport",
      tr: "/spor",
      de: "/sport",
      ru: "/sport",
    },
  
    "/sustainability": {
      en: "/sustainability",
      tr: "/surdurulebilirlik",
      de: "/nachhaltigkeit",
      ru: "/ustoychivost",
    },
  
    "/terms-of-use": {
      en: "/terms-of-use",
      tr: "/kullanim-sartlari",
      de: "/nutzungsbedingungen",
      ru: "/usloviya-ispolzovaniya",
    },
  }
  })
