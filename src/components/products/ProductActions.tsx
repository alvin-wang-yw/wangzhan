'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Zap, Mail, Minus, Plus } from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  productName: string;
  price: string;
  stock: number;
  minOrderQty: number;
  inStock: boolean;
  locale: string;
  productSlug: string;
  productImage?: string;
}

/**
 * 产品操作栏 - 客户端组件
 * 数量选择 + 加入购物车 + 立即购买 + 询盘
 * 支持登录用户（API）和未登录用户（localStorage）两种模式
 */
export default function ProductActions({
  productId,
  productName,
  price,
  stock,
  minOrderQty,
  inStock,
  locale,
  productSlug,
  productImage,
}: ProductActionsProps) {
  const t = useTranslations('product');
  const commonT = useTranslations('common');
  const [quantity, setQuantity] = useState(minOrderQty || 1);
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState('');

  const decreaseQty = () => {
    if (quantity > (minOrderQty || 1)) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQty = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || minOrderQty || 1;
    if (val < (minOrderQty || 1)) {
      setQuantity(minOrderQty || 1);
    } else if (val > stock && stock > 0) {
      setQuantity(stock);
    } else {
      setQuantity(val);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2000);
  };

  /**
   * 添加到购物车
   * 登录用户调用 API，未登录用户写入 localStorage
   */
  const handleAddToCart = async () => {
    if (!inStock) return;
    setIsAdding(true);

    try {
      // 先尝试调用 API（登录用户）
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        // 登录用户 API 成功
        const data = await res.json();
        showToast(commonT('addedToCart'));
        // 触发自定义事件通知 Header 更新购物车数量
        window.dispatchEvent(new Event('cart-updated'));
      } else if (res.status === 401) {
        // 未登录 - 使用 localStorage
        addToLocalStorage();
        showToast(commonT('addedToCart'));
      } else {
        const data = await res.json();
        showToast(data.error || t('addToCart') + ' failed');
      }
    } catch {
      // 请求失败时降级到 localStorage
      addToLocalStorage();
      showToast(commonT('addedToCart'));
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * 添加到 localStorage（未登录用户）
   */
  const addToLocalStorage = () => {
    try {
      const stored = localStorage.getItem('cart');
      const items = stored ? JSON.parse(stored) : [];

      // 查找是否已存在
      const existingIndex = items.findIndex(
        (item: any) => item.productId === productId
      );

      if (existingIndex >= 0) {
        // 更新数量
        items[existingIndex].quantity += quantity;
      } else {
        // 新增
        items.push({
          id: `local_${Date.now()}`,
          productId,
          quantity,
          unitPrice: price,
          product: {
            id: productId,
            name: productName,
            slug: productSlug,
            images: productImage ? [{ url: productImage, altText: productName }] : [],
          },
        });
      }

      localStorage.setItem('cart', JSON.stringify(items));
      // 触发事件通知 Header 更新
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error) {
      console.error('Failed to add to localStorage cart:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!inStock) return;
    // 先加购再跳转
    await handleAddToCart();
    setTimeout(() => {
      window.location.href = `/${locale}/checkout`;
    }, 300);
  };

  const handleInquiry = () => {
    // 跳转到联系页面并带上产品信息
    const params = new URLSearchParams({
      productId,
      productName,
    });
    window.location.href = `/${locale}/contact?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* 数量选择 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('quantity')}
          {minOrderQty > 1 && (
            <span className="text-muted-foreground font-normal ml-2">
              ({t('minOrderQty', { quantity: minOrderQty })})
            </span>
          )}
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md">
            <button
              onClick={decreaseQty}
              disabled={!inStock || quantity <= (minOrderQty || 1)}
              className="p-2.5 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min={minOrderQty || 1}
              max={stock || undefined}
              className="w-16 text-center border-x py-2.5 bg-background focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={increaseQty}
              disabled={!inStock || (stock > 0 && quantity >= stock)}
              className="p-2.5 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {stock > 0 && (
            <span className="text-sm text-muted-foreground">
              {stock} {t('inStock')}
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          {t('addToCart')}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="flex-1 py-3 px-6 bg-foreground text-background rounded-md font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          <Zap className="h-5 w-5" />
          {t('buyNow')}
        </button>
      </div>

      {/* 询盘按钮 */}
      <button
        onClick={handleInquiry}
        className="w-full py-3 px-6 border-2 border-dashed rounded-md font-medium hover:bg-accent transition-colors inline-flex items-center justify-center gap-2 text-foreground"
      >
        <Mail className="h-5 w-5" />
        {t('inquiry')}
      </button>

      {/* 提示消息 */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-foreground text-background px-4 py-3 rounded-md shadow-lg flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {notification}
          </div>
        </div>
      )}
    </div>
  );
}
