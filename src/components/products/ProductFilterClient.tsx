'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Filter, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: CategoryNode[];
}

interface ProductFilterClientProps {
  categories: CategoryNode[];
  currentCategory: string;
  currentSort: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentKeyword: string;
  locale: string;
}

/**
 * 产品筛选 - 移动端交互组件
 * PC 端侧边栏直接在服务端渲染
 * 移动端使用弹窗形式展示筛选
 */
export default function ProductFilterClient({
  categories,
  currentCategory,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  currentKeyword,
  locale,
}: ProductFilterClientProps) {
  const t = useTranslations('product');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const buildQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams();
    if (currentCategory && updates.category !== undefined && updates.category) {
      params.set('category', updates.category);
    } else if (currentCategory && updates.category === undefined) {
      params.set('category', currentCategory);
    } else if (updates.category) {
      params.set('category', updates.category);
    }
    if (currentSort && updates.sort !== undefined && updates.sort) {
      params.set('sort', updates.sort);
    } else if (currentSort && updates.sort === undefined) {
      params.set('sort', currentSort);
    }
    if (currentKeyword) params.set('keyword', currentKeyword);
    if (updates.minPrice) params.set('minPrice', updates.minPrice);
    if (updates.maxPrice) params.set('maxPrice', updates.maxPrice);
    return params.toString();
  };

  return (
    <>
      {/* 移动端筛选按钮 */}
      <div className="lg:hidden mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
        >
          <Filter className="h-4 w-4" />
          {t('filterBy')}
        </button>

        <select
          defaultValue={currentSort}
          onChange={(e) => {
            const params = new URLSearchParams();
            if (currentCategory) params.set('category', currentCategory);
            params.set('sort', e.target.value);
            if (currentMinPrice) params.set('minPrice', currentMinPrice);
            if (currentMaxPrice) params.set('maxPrice', currentMaxPrice);
            if (currentKeyword) params.set('keyword', currentKeyword);
            window.location.href = `/${locale}/products?${params.toString()}`;
          }}
          className="flex-1 px-3 py-2 border rounded-md text-sm bg-background border-input"
        >
          <option value="newest">{t('sortNewest')}</option>
          <option value="featured">{t('sortFeatured')}</option>
          <option value="price-asc">{t('sortPriceLow')}</option>
          <option value="price-desc">{t('sortPriceHigh')}</option>
        </select>
      </div>

      {/* 移动端筛选弹窗 */}
      {mobileFilterOpen && (
        <div className="lg:hidden">
          {/* 遮罩 */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setMobileFilterOpen(false)}
          />
          {/* 抽屉 */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-card z-50 shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="font-semibold">{t('filterBy')}</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* 分类 */}
              <div>
                <h4 className="font-medium mb-3">{t('categories')}</h4>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href={`/${locale}/products${currentKeyword ? `?keyword=${currentKeyword}` : ''}`}
                      onClick={() => setMobileFilterOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm',
                        !currentCategory
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {t('allProducts')}
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/${locale}/products?${buildQuery({ category: cat.slug })}`}
                        onClick={() => setMobileFilterOpen(false)}
                        className={cn(
                          'block px-3 py-2 rounded-md text-sm',
                          currentCategory === cat.slug
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {cat.name} ({cat.productCount})
                      </Link>
                      {cat.children.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {cat.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/${locale}/products?${buildQuery({ category: child.slug })}`}
                                onClick={() => setMobileFilterOpen(false)}
                                className={cn(
                                  'block px-3 py-1.5 rounded-md text-sm',
                                  currentCategory === child.slug
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-muted'
                                )}
                              >
                                {child.name} ({child.productCount})
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 价格区间 */}
              <div>
                <h4 className="font-medium mb-3">{t('priceRange')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="mobile-min-price"
                      min="0"
                      placeholder="Min"
                      defaultValue={currentMinPrice}
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background border-input"
                    />
                    <span className="text-muted-foreground">—</span>
                    <input
                      type="number"
                      id="mobile-max-price"
                      min="0"
                      placeholder="Max"
                      defaultValue={currentMaxPrice}
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background border-input"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const min = (document.getElementById('mobile-min-price') as HTMLInputElement).value;
                      const max = (document.getElementById('mobile-max-price') as HTMLInputElement).value;
                      const params = new URLSearchParams();
                      if (currentCategory) params.set('category', currentCategory);
                      if (currentSort) params.set('sort', currentSort);
                      if (min) params.set('minPrice', min);
                      if (max) params.set('maxPrice', max);
                      if (currentKeyword) params.set('keyword', currentKeyword);
                      window.location.href = `/${locale}/products?${params.toString()}`;
                    }}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {t('filterBy')}
                  </button>
                </div>
              </div>

              {/* 排序 */}
              <div>
                <h4 className="font-medium mb-3">{t('sortBy')}</h4>
                <div className="space-y-1">
                  {[
                    { value: 'newest', label: t('sortNewest') },
                    { value: 'featured', label: t('sortFeatured') },
                    { value: 'price-asc', label: t('sortPriceLow') },
                    { value: 'price-desc', label: t('sortPriceHigh') },
                  ].map((item) => (
                    <Link
                      key={item.value}
                      href={`/${locale}/products?${buildQuery({ sort: item.value })}`}
                      onClick={() => setMobileFilterOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm',
                        currentSort === item.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
