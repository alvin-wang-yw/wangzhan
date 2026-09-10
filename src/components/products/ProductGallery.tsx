'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isMain: boolean;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * 产品图片轮播 - 客户端组件
 * 主图 + 缩略图切换
 */
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const validImages = images.length > 0 ? images : [{ id: 'placeholder', url: '', altText: productName, isMain: true }];
  const currentImage = validImages[activeIndex];

  const prevImage = () => {
    setActiveIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setActiveIndex((prev) =>
      prev === validImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="space-y-4">
      {/* 主图 */}
      <div className="relative aspect-square bg-muted border rounded-lg overflow-hidden">
        {currentImage.url ? (
          <img
            src={currentImage.url}
            alt={currentImage.altText || productName}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-24 w-24 opacity-20" />
          </div>
        )}

        {/* 左右切换按钮（仅在有多张图时显示） */}
        {validImages.length > 1 && currentImage.url && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* 图片计数 */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {activeIndex + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* 缩略图 */}
      {validImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {validImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all',
                activeIndex === index
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground'
              )}
            >
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.altText || `${productName} - ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
