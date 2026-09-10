'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; altText: string | null }[];
  };
}

interface CartSummary {
  itemCount: number;
  subtotal: string;
  shippingFee: string;
  total: string;
  isFreeShipping: boolean;
}

/**
 * 购物车客户端组件
 * 支持登录用户（API）和未登录用户（localStorage）两种模式
 */
export default function CartClient({
  isLoggedIn,
  initialItems,
  initialSummary,
  locale,
}: {
  isLoggedIn: boolean;
  initialItems: CartItemData[];
  initialSummary: CartSummary | null;
  locale: string;
}) {
  const t = useTranslations('cart');
  const commonT = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<CartItemData[]>(initialItems);
  const [summary, setSummary] = useState<CartSummary | null>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // 未登录时从 localStorage 加载
  useEffect(() => {
    if (!isLoggedIn) {
      loadLocalCart();
    }
  }, [isLoggedIn]);

  // 从 localStorage 加载购物车
  const loadLocalCart = () => {
    try {
      const stored = localStorage.getItem('cart');
      if (stored) {
        const localItems = JSON.parse(stored);
        setItems(localItems);
        setSummary(calculateLocalSummary(localItems));
      }
    } catch {
      console.error('Failed to load cart from localStorage');
    }
  };

  // 计算本地购物车摘要
  const calculateLocalSummary = (localItems: CartItemData[]): CartSummary => {
    const itemCount = localItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = localItems.reduce(
      (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
      0
    );
    const shippingFee = subtotal >= 99 ? 0 : 9.99;
    const total = subtotal + shippingFee;
    return {
      itemCount,
      subtotal: subtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      total: total.toFixed(2),
      isFreeShipping: shippingFee === 0,
    };
  };

  // 保存到 localStorage
  const saveLocalCart = (localItems: CartItemData[]) => {
    localStorage.setItem('cart', JSON.stringify(localItems));
    setSummary(calculateLocalSummary(localItems));
    // 触发自定义事件通知 Header 更新
    window.dispatchEvent(new Event('cart-updated'));
  };

  // 更新数量
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setLoading(true);
    try {
      if (isLoggedIn) {
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, quantity: newQuantity }),
        });
        const data = await res.json();
        if (res.ok) {
          setItems(data.items);
          setSummary(data.summary);
        }
      } else {
        const newItems = items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setItems(newItems);
        saveLocalCart(newItems);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除商品
  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      if (isLoggedIn) {
        const res = await fetch(`/api/cart?itemId=${itemId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
          setItems(data.items);
          setSummary(data.summary);
        }
      } else {
        const newItems = items.filter((item) => item.id !== itemId);
        setItems(newItems);
        saveLocalCart(newItems);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  // 应用优惠码（占位功能）
  const applyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError(locale === 'zh' ? '请输入优惠码' : 'Please enter a coupon code');
      return;
    }
    setCouponError(locale === 'zh' ? '优惠码无效' : 'Invalid coupon code');
  };

  // 去结算
  const proceedToCheckout = () => {
    router.push(`/${locale}/checkout`);
  };

  const currentLocale = pathname.split('/')[1] || 'en';

  // 空购物车
  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('empty')}</h1>
          <p className="text-muted-foreground mb-8">{t('emptyDesc')}</p>
          <Link
            href={`/${currentLocale}/products`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <ShoppingCart className="h-7 w-7" />
        {t('title')}
        <span className="text-base font-normal text-muted-foreground">
          ({t('itemsCount', { count: summary?.itemCount || 0 })})
        </span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左侧：商品列表 */}
        <div className="flex-1 min-w-0">
          <div className="border rounded-lg overflow-hidden bg-card">
            {/* 表头 - 桌面端 */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-6">{t('product')}</div>
              <div className="col-span-2 text-center">{t('price')}</div>
              <div className="col-span-2 text-center">{t('quantity')}</div>
              <div className="col-span-2 text-right">{t('subtotal')}</div>
            </div>

            {/* 商品列表 */}
            <div className="divide-y">
              {items.map((item) => {
                const image = item.product.images?.[0];
                const subtotal = (
                  parseFloat(item.unitPrice) * item.quantity
                ).toFixed(2);

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center"
                  >
                    {/* 商品信息 */}
                    <div className="md:col-span-6 flex gap-4">
                      <Link
                        href={`/${currentLocale}/products/${item.product.slug}`}
                        className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted border"
                      >
                        {image?.url ? (
                          <img
                            src={image.url}
                            alt={image.altText || item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${currentLocale}/products/${item.product.slug}`}
                          className="font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <div className="mt-1 md:hidden flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(item.unitPrice)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-2 text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 transition-colors"
                          disabled={loading}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('remove')}
                        </button>
                      </div>
                    </div>

                    {/* 单价 - 仅桌面端 */}
                    <div className="hidden md:block md:col-span-2 text-center font-medium">
                      {formatPrice(item.unitPrice)}
                    </div>

                    {/* 数量 */}
                    <div className="md:col-span-2 flex md:justify-center">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={loading || item.quantity <= 1}
                          className="p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                          className="p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* 小计 */}
                    <div className="md:col-span-2 text-right md:text-right font-semibold">
                      {formatPrice(subtotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：结算栏 */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="border rounded-lg bg-card p-5 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">{t('cartTotal')}</h2>

            {/* 优惠码 */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError('');
                    }}
                    placeholder={locale === 'zh' ? '优惠码' : 'Coupon code'}
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
                >
                  {locale === 'zh' ? '应用' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="mt-1 text-xs text-destructive">{couponError}</p>
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('itemsCount', { count: summary?.itemCount || 0 })}
                </span>
                <span className="font-medium">{formatPrice(summary?.subtotal || '0')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span className="font-medium">
                  {summary?.isFreeShipping ? (
                    <span className="text-green-600">{t('freeShipping')}</span>
                  ) : (
                    formatPrice(summary?.shippingFee || '0')
                  )}
                </span>
              </div>
              {!summary?.isFreeShipping && (
                <p className="text-xs text-muted-foreground">
                  {locale === 'zh'
                    ? '满 $99 免运费'
                    : 'Free shipping on orders over $99'}
                </p>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">{t('total')}</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(summary?.total || '0')}
                </span>
              </div>
            </div>

            <button
              onClick={proceedToCheckout}
              className="w-full mt-5 py-3 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              {t('proceedToCheckout')}
              <ArrowRight className="h-5 w-5" />
            </button>

            <Link
              href={`/${currentLocale}/products`}
              className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-primary text-center block transition-colors"
            >
              ← {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
