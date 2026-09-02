"use client";
import React, { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

function getImageProps(image, fallbackAlt = "") {
  if (typeof image === "string") {
    return { src: image, width: 1600, height: 1067, alt: fallbackAlt };
  }

  return {
    src: image.src,
    width: image.width || 1600,
    height: image.height || 1067,
    alt: image.alt || fallbackAlt,
  };
}

const SubroomCarousel = ({images}) => {
  const [emblaRef] = useEmblaCarousel({ align: "start",  loop: true, });

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const openImage = (index) => {
    setSelectedIndex(index);
    setSelectedImage(images[index]);
  };

  const closeImage = () => {
    setSelectedIndex(null);
    setSelectedImage(null);
  };

  const prevImage = () => {
    if (selectedIndex !== null) {
      const newIndex = (selectedIndex - 1 + images.length) % images.length;
      setSelectedIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  const nextImage = () => {
    if (selectedIndex !== null) {
      const newIndex = (selectedIndex + 1) % images.length;
      setSelectedIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  return (
    <>
      {/* Carousel */}
      <div className="overflow-hidden w-screen mt-[5px]" ref={emblaRef}>
        <div className="flex gap-[5px] ">
          {images.map((img, index) => {
            const image = getImageProps(img, `Oda görseli ${index + 1}`);

            return (
            <div
              key={img.id || `${image.src}-${index}`}
              className="flex-[0_0_auto] lg:flex-[0_0_calc(100vw/3.9)] 2xl:flex-[0_0_auto] 2xl:h-[28vh] lg::min-w-[372px] h-[24vh] sm:h-[30vh] md:h-[26vh] lg:h-[32vh]  bg-gray-300 overflow-hidden cursor-pointer "
              onClick={() => openImage(index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                className="w-auto h-full object-cover"
                width={image.width}
                height={image.height}
              />
            </div>
            );
          })}
        </div>
      </div>

      {/* Modal (Resmi Büyütme, Geri-İleri & Kapat Butonu) */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[9999]">
          {/* Kapatma Butonu (Sağ Üstte) */}
          <button
            onClick={closeImage}
            className="absolute top-5 right-5 text-white text-4xl font-bold bg-gray-900 bg-opacity-50 px-4 py-2 rounded-full hover:bg-opacity-75 transition"
          >
             <div className='flex bg-black/50 items-center justify-center h-10 w-10  '>
          <div className='flex h-[2px] w-6 rotate-[-45deg] flex-shrink-0 bg-white'></div>
          <div className='flex absolute h-[2px] w-6 rotate-[45deg] flex-shrink-0 bg-white'></div>
          </div>
          </button>

          {/* Seçili Resim */}
          <div className="relative flex items-center justify-center mt-1">
            <Image
              src={getImageProps(selectedImage, "Seçili oda görseli").src}
              alt={getImageProps(selectedImage, "Seçili oda görseli").alt}
              className=" w-[90vw] h-[80vh] object-contain shadow-lg transition-transform duration-300 ease-in-out scale-100 hover:scale-105"
              width={getImageProps(selectedImage).width}
              height={getImageProps(selectedImage).height}
            />
          </div>

          {/* Geri & İleri Butonları (Resmin Altında) */}
          <div className="flex w-full justify-center gap-20 mt-6">
            <button
              onClick={prevImage}
              className="text-white text-2xl font-bold bg-gray-900 bg-opacity-50 p-2 hover:bg-opacity-75 transition"
            >
              <MdKeyboardArrowLeft size={40}/>
            </button>

            <button
              onClick={nextImage}
              className="text-white text-2xl font-bold bg-gray-900 bg-opacity-50 p-2 r hover:bg-opacity-75 transition"
            >
             <MdKeyboardArrowRight size={40}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SubroomCarousel;
