"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";

export default function GalleryScrollSection({ categories }) {
  const t = useTranslations("Gallery");
  const availableCategories = useMemo(
    () => (categories || []).filter((category) => category.images.length > 0),
    [categories]
  );
  const [selectedCategory, setSelectedCategory] = useState(
    availableCategories[0]?.id || ""
  );
  const [modalIndex, setModalIndex] = useState(null);

  useEffect(() => {
    if (!availableCategories.find((category) => category.id === selectedCategory)) {
      setSelectedCategory(availableCategories[0]?.id || "");
    }
  }, [availableCategories, selectedCategory]);

  const activeCategory =
    availableCategories.find((category) => category.id === selectedCategory) ||
    availableCategories[0];
  const activeImages = activeCategory?.images || [];
  const modalImage = modalIndex == null ? null : activeImages[modalIndex];

  const openModal = (index) => setModalIndex(index);
  const closeModal = () => setModalIndex(null);

  const scrollPrev = () => {
    if (!activeImages.length) return;
    setModalIndex((currentIndex) =>
      currentIndex === 0 ? activeImages.length - 1 : currentIndex - 1
    );
  };

  const scrollNext = () => {
    if (!activeImages.length) return;
    setModalIndex((currentIndex) =>
      currentIndex === activeImages.length - 1 ? 0 : currentIndex + 1
    );
  };

  useEffect(() => {
    if (!modalImage) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        scrollNext();
      } else if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalImage]);

  if (!availableCategories.length) {
    return (
      <div className="flex w-full items-center justify-center px-6 py-16">
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 text-sm text-stone-500">
          Galeriye henuz gorsel eklenmedi.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[50px] flex w-screen items-center justify-center max-w-[1440px]">
      <div className="flex w-[87.79%] flex-col items-center justify-between gap-[40px] md:w-[91.4%] lg:w-[76.8%]">
        <div className="grid w-full max-w-[1008px] grid-cols-3 gap-[10px] md:grid-cols-4 lg:grid-cols-5 xl:flex xl:justify-between">
          {availableCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center justify-center whitespace-nowrap border border-lagoGray px-[16px] py-[12px] text-[12px] font-medium uppercase leading-[125%] -tracking-[0.33px] font-jost transition lg:w-[140px] lg:px-[20px] lg:py-[16px] lg:text-[14px] ${
                selectedCategory === category.id
                  ? "bg-lagoGray text-white"
                  : "text-lagoGray hover:bg-stone-100"
              }`}
            >
              {t(category.id)}
            </button>
          ))}
        </div>

        <div className="flex h-[500px] lg:w-[1006px] md:h-[1000px] lg:h-[1700px]">
          <div className="custom-scroll flex h-auto w-full flex-col overflow-auto hover:overflow-scroll">
            <div className="columns-2 gap-[16px] transition-all duration-[350ms] ease-in-out lg:columns-3 lg:gap-[0px]">
              {activeImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => openModal(index)}
                  className="mb-[19.16px] block w-full cursor-pointer transition-all duration-[350ms] ease-in-out"
                >
                  <Image
                    src={image.src}
                    alt={image.alt || t("title")}
                    width={1200}
                    height={800}
                    className="h-full w-full object-cover lg:w-[322px]"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {modalImage ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
            onClick={closeModal}
          >
            <div className="relative w-[80%]" onClick={(event) => event.stopPropagation()}>
              <Image
                src={modalImage.src}
                alt={modalImage.alt || t("title")}
                width={1600}
                height={1200}
                className="max-h-[890px] w-full object-cover"
                unoptimized
              />

              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-700 bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                onClick={scrollPrev}
                aria-label="Previous"
              >
                <MdArrowBackIosNew size={32} />
              </button>

              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-700 bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                onClick={scrollNext}
                aria-label="Next"
              >
                <MdArrowForwardIos size={32} />
              </button>
            </div>

            <button
              className="absolute right-4 top-6 text-4xl text-white"
              onClick={closeModal}
            >
              &times;
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
