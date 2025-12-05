'use client';

import { useState, useEffect } from 'react';
import { HiChevronRight, HiChevronLeft } from 'react-icons/hi';

interface ProductImage {
  src: string;
  alt?: string;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  title: string;
  selectedVariant?: string; // For variant-based image changes
  noImageText?: string;
}

export function ProductImageGallery({
  images,
  title,
  selectedVariant,
  noImageText = 'אין תמונה',
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset to first image when variant changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedVariant]);

  const currentImage = images[selectedIndex] || images[0];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">{noImageText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        {currentImage ? (
          <img
            src={currentImage.src}
            alt={currentImage.alt || title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400">{noImageText}</p>
          </div>
        )}

        {/* Previous/Next Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="תמונה קודמת"
            >
              <HiChevronRight className="w-6 h-6 text-gray-900" />
            </button>
            <button
              onClick={handleNext}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="תמונה הבאה"
            >
              <HiChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === index
                  ? 'border-black'
                  : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`תמונה ${index + 1}`}
              aria-pressed={selectedIndex === index}
            >
              <img
                src={image.src}
                alt={image.alt || `${title} - תמונה ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

