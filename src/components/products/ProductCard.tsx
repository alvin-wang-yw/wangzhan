import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  originalPrice?: number | string | null;
  image?: string;
  imageAlt?: string;
  locale: string;
  isNew?: boolean;
  featured?: boolean;
}

/**
 * 产品卡片组件
 * 服务端组件，用于产品列表展示
 */
export default function ProductCard({
  name,
  slug,
  price,
  originalPrice,
  image,
  imageAlt,
  locale,
  isNew,
  featured,
}: ProductCardProps) {
  const hasDiscount = originalPrice && Number(originalPrice) > Number(price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : 0;

  return (
    <div className="group bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* 图片区域 */}
      <Link href={`/${locale}/products/${slug}`} className="block relative aspect-square bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={imageAlt || name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}

        {/* 标签 */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isNew && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
              New
            </span>
          )}
          {featured && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded">
              Hot
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* 悬浮加入购物车按钮 */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            className="p-2.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </Link>

      {/* 信息区域 */}
      <div className="p-4">
        <Link href={`/${locale}/products/${slug}`}>
          <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 min-h-[3rem] text-sm md:text-base">
            {name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
