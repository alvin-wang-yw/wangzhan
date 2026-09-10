'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductCard from './ProductCard';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: string;
  originalPrice: string | null;
  image: string;
  imageAlt: string;
  isNew: boolean;
  featured: boolean;
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: CategoryNode[];
}

interface ProductListClientProps {
  products: ProductItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: CategoryNode[];
  currentCategory: string;
  currentSort: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentKeyword: string;
  locale: string;
}

/**
 * 产品列表交互组件 - 客户端
 * 处理筛选、排序、分页的交互
 */
export default function ProductListClient({
  products,
  total,
  page,
  pageSize,
  categories,
  currentCategory,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  currentKeyword,
  locale,
}: ProductListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('product');
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentSort) params.set('sort', currentSort);
    if (currentMinPrice) params.set('minPrice', currentMinPrice);
    if (currentMaxPrice) params.set('maxPrice', currentMaxPrice);
    if (currentKeyword) params.set('keyword', currentKeyword);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ sort: e.target.value, page: '1' }));
  };

  const handlePriceFilter = () => {
    const updates: Record<string, string> = { page: '1' };
    if (minPriceInput) updates.minPrice = minPriceInput;
    else updates.minPrice = '';
    if (maxPriceInput) updates.maxPrice = maxPriceInput;
    else updates.maxPrice = '';
    router.push(buildUrl(updates));
  };

  const handleCategoryClick = (slug: string) => {
    router.push(buildUrl({ category: slug, page: '1' }));
  };

  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    router.push(buildUrl({ page: pageNum.toString() }));
  };

  // 渲染分页页码
  const getPageNumbers = () => {
    const pages: number[] = [];
    const total = totalPages;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (page >= total - 2) {
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex gap-8">
      {/* 左侧筛选栏 - PC端显示 */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="space-y-6 sticky top-4">
          {/* 分类筛选 */}
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold mb-4">{t('categories')}</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleCategoryClick('')}
                  className={cn(
                    'w-full text-left block px-3 py-2 rounded-md text-sm transition-colors',
                    !currentCategory
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {t('allProducts')} ({total})
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={cn(
                      'w-full text-left block px-3 py-2 rounded-md text-sm transition-colors',
                      currentCategory === cat.slug
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {cat.name} ({cat.productCount})
                  </button>
                  {cat.children.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <button
                            onClick={() => handleCategoryClick(child.slug)}
                            className={cn(
                              'w-full text-left block px-3 py-1.5 rounded-md text-sm transition-colors',
                              currentCategory === child.slug
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            {child.name} ({child.productCount})
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 价格区间 */}
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold mb-4">{t('priceRange')}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handlePriceFilter}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t('filterBy')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 右侧产品网格 */}
      <div className="flex-1 min-w-0">
        {/* 排序栏 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <p className="text-sm text-muted-foreground">
            {t('allProducts')} ({total})
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">{t('sortBy')}</label>
            <select
              value={currentSort}
              onChange={handleSortChange}
              className="px-3 py-1.5 border rounded-md text-sm bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="featured">{t('sortFeatured')}</option>
              <option value="price-asc">{t('sortPriceLow')}</option>
              <option value="price-desc">{t('sortPriceHigh')}</option>
            </select>
          </div>
        </div>

        {/* 产品网格 - 服务端组件的卡片渲染在这里 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.image}
              imageAlt={product.imageAlt}
              locale={locale}
              isNew={product.isNew}
              featured={product.featured}
            />
          ))}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <button
                onClick={() => goToPage(page - 1)}
                className="p-2 border rounded-md hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={cn(
                  'w-9 h-9 rounded-md text-sm font-medium transition-colors flex items-center justify-center',
                  page === pageNum
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent text-muted-foreground'
                )}
              >
                {pageNum}
              </button>
            ))}

            {page < totalPages && (
              <button
                onClick={() => goToPage(page + 1)}
                className="p-2 border rounded-md hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
