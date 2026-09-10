'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  stock: number;
  status: string;
  featured: boolean;
  categoryName: string;
  image: string;
  createdAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface AdminProductsClientProps {
  initialProducts: ProductItem[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialKeyword: string;
  initialCategoryId: string;
  initialStatus: string;
  categories: CategoryOption[];
}

export default function AdminProductsClient({
  initialProducts,
  initialTotal,
  initialPage,
  initialPageSize,
  initialKeyword,
  initialCategoryId,
  initialStatus,
  categories,
}: AdminProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.products');
  const commonT = useTranslations('common');

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  // 创建带参数的 URL
  const createUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams]
  );

  // 搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = createUrl({ keyword, categoryId, status, page: '1' });
    router.push(url);
  };

  // 翻页
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const url = createUrl({ page: newPage.toString() });
    router.push(url);
  };

  // 删除产品
  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      // 本地移除
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 状态颜色
  const getStatusClass = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-600';
      case 'DRAFT':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return t('statusActive');
      case 'INACTIVE':
        return t('statusInactive');
      case 'DRAFT':
        return t('statusDraft');
      default:
        return s;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')} ({total})
          </p>
        </div>
        <button
          onClick={() => router.push(`${pathname}/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('addProduct')}
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-card border rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          {/* 关键词搜索 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
              />
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="w-48">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('category')}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            >
              <option value="">{t('allStatus')}</option>
              <option value="ACTIVE">{t('statusActive')}</option>
              <option value="INACTIVE">{t('statusInactive')}</option>
              <option value="DRAFT">{t('statusDraft')}</option>
            </select>
          </div>

          {/* 搜索按钮 */}
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {commonT('search')}
          </button>
        </form>
      </div>

      {/* 产品表格 */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                <th className="text-left px-4 py-3 w-16">{t('image')}</th>
                <th className="text-left px-4 py-3">{t('productName')}</th>
                <th className="text-left px-4 py-3 w-28">{t('sku')}</th>
                <th className="text-left px-4 py-3 w-32">{t('category')}</th>
                <th className="text-right px-4 py-3 w-24">{t('price')}</th>
                <th className="text-right px-4 py-3 w-20">{t('stock')}</th>
                <th className="text-center px-4 py-3 w-24">{t('status')}</th>
                <th className="text-center px-4 py-3 w-28">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('noProducts')}</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground truncate max-w-xs">
                        {product.name}
                      </div>
                      {product.featured && (
                        <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                          {t('featured')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {product.categoryName}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={product.stock > 0 ? '' : 'text-destructive'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusClass(
                          product.status
                        )}`}
                      >
                        {getStatusText(product.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => router.push(`${pathname}/edit/${product.id}`)}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          title={commonT('edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={isLoading}
                          className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title={commonT('delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {commonT('page', { current: page, total: totalPages })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-2 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (page > 3) {
                    pageNum = page - 2 + i;
                  }
                  if (page > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
