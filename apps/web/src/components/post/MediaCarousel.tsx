'use client';

import { useState } from 'react';

interface MediaCarouselProps {
  images: string[];
}

export function MediaCarousel({ images }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) return null;

  return (
    <div className="relative w-full aspect-square bg-gray-100 group">
      {/* Main Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[currentIndex]}
        alt={`Post image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="50%25" dx="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';
        }}
      />

      {/* Navigation Arrows - Only show if more than 1 image */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            aria-label="Previous image"
          >
            <span className="text-xl">‹</span>
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            aria-label="Next image"
          >
            <span className="text-xl">›</span>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
