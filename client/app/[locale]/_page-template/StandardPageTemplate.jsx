import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getLocalizedContent } from "@/lib/pages/schema.mjs";
import ContactSection2 from "../GeneralComponents/Contact/ContactSection2";

function isGif(src) {
  return String(src || "").toLowerCase().split("?")[0].endsWith(".gif");
}

function Eyebrow({ children }) {
  if (!children) {
    return null;
  }

  return (
    <span className="font-jost text-[12px] font-medium uppercase leading-[14px] tracking-[0.6px]">
      {children}
    </span>
  );
}

function HeroSection({ hero, locale, preview = false }) {
  const content = getLocalizedContent(hero?.translations, locale);

  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden bg-stone-700 ${
        preview ? "min-h-[420px] w-full" : "min-h-[70vh] w-screen"
      }`}
    >
      {hero?.image ? (
        <Image
          src={hero.image}
          alt={content.imageAlt || ""}
          fill
          priority
          unoptimized={isGif(hero.image)}
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950" />
      )}

      {hero?.overlay !== false ? <div className="absolute inset-0 bg-lagoBlack/35" /> : null}

      <div className="relative z-10 flex w-[85%] max-w-5xl flex-col items-center gap-[30px] text-center text-white lg:gap-[50px]">
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <h1 className="font-jost text-[40px] font-medium capitalize leading-[120%] md:text-[56px] lg:text-[80px] lg:leading-[106px]">
          {content.title}
        </h1>
      </div>
    </section>
  );
}

function IntroSection({ section, locale }) {
  const content = getLocalizedContent(section.translations, locale);

  return (
    <section className="flex w-[88%] max-w-4xl flex-col items-center gap-5 text-center text-lagoBlack">
      <Eyebrow>{content.eyebrow}</Eyebrow>
      {content.title ? (
        <h2 className="font-marcellus text-[32px] leading-[120%] md:text-[42px] lg:text-[52px]">
          {content.title}
        </h2>
      ) : null}
      {content.text ? (
        <p className="whitespace-pre-line font-jost text-[15px] leading-7 text-stone-600 md:text-[17px]">
          {content.text}
        </p>
      ) : null}
    </section>
  );
}

function ImagePlaceholder() {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center bg-stone-200 font-jost text-sm uppercase tracking-[0.2em] text-stone-500">
      Görsel alanı
    </div>
  );
}

function ImageTextSection({ section, locale }) {
  const content = getLocalizedContent(section.translations, locale);
  const imageFirst = section.imagePosition !== "right";

  const image = (
    <div className={`relative w-full overflow-hidden ${imageFirst ? "lg:order-1" : "lg:order-2"}`}>
      {section.image ? (
        <Image
          src={section.image}
          alt={content.imageAlt || ""}
          width={1200}
          height={900}
          unoptimized={isGif(section.image)}
          sizes="(min-width: 1024px) 50vw, 90vw"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <ImagePlaceholder />
      )}
    </div>
  );

  const text = (
    <div
      className={`flex w-full flex-col items-start justify-center gap-5 px-1 py-5 text-lagoBlack md:px-8 lg:px-14 ${
        imageFirst ? "lg:order-2" : "lg:order-1"
      }`}
    >
      <Eyebrow>{content.eyebrow}</Eyebrow>
      {content.title ? (
        <h2 className="font-marcellus text-[30px] leading-[120%] md:text-[40px] lg:text-[48px]">
          {content.title}
        </h2>
      ) : null}
      {content.text ? (
        <p className="whitespace-pre-line font-jost text-[15px] leading-7 text-stone-600 md:text-[16px]">
          {content.text}
        </p>
      ) : null}
      {content.buttonText && content.buttonHref ? (
        <Link
          href={content.buttonHref}
          className="font-marcellus text-[16px] uppercase leading-[30px] text-lagoBrown underline underline-offset-[6px]"
        >
          {content.buttonText}
        </Link>
      ) : null}
    </div>
  );

  return (
    <section className="grid w-[90%] max-w-[1400px] grid-cols-1 items-stretch overflow-hidden bg-white lg:grid-cols-2">
      {image}
      {text}
    </section>
  );
}

const SECTION_COMPONENTS = {
  intro: IntroSection,
  imageText: ImageTextSection,
};

export default function StandardPageTemplate({ page, locale, preview = false }) {
  const enabledSections = (page.sections || []).filter((section) => section.enabled !== false);

  return (
    <main
      className={`flex flex-col items-center justify-center overflow-hidden bg-[#fbfbfb] ${
        preview
          ? "w-full gap-[60px] rounded-2xl border border-stone-200"
          : "gap-[60px] md:gap-[80px] lg:gap-[100px]"
      }`}
    >
      <HeroSection hero={page.hero} locale={locale} preview={preview} />

      {enabledSections.map((section) => {
        const SectionComponent = SECTION_COMPONENTS[section.type];

        if (!SectionComponent) {
          return null;
        }

        return <SectionComponent key={section.id} section={section} locale={locale} />;
      })}

      {!preview && page.showContactSection !== false ? <ContactSection2 /> : null}
    </main>
  );
}
