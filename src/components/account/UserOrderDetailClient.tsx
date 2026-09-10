'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

/**
 * 用户订单详情 - 客户端组件
 */
export default function UserOrderDetailClient({
  orderId,
  locale,
}: {
  orderId: string;
  locale: string;
}) {
  const orderT = useTranslations('order');
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split('/')[1] || 'en';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to load order');
      }
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const getStatusLabel = (s: string) => {
    try {
      return orderT(`status.${s.toLowerCase()}`);
    } catch {
      return s;
    }
  };

  const handleBuyAgain = () => {
    router.push(`/${currentLocale}/products`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive">{error}</p>
        <Link
          href={`/${currentLocale}/account/orders`}
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === 'zh' ? '返回订单列表' : 'Back to orders'}
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* 返回 */}
      <Link
        href={`/${currentLocale}/account/orders`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === 'zh' ? '返回订单列表' : 'Back to orders'}
      </Link>

      {/* 订单头部 */}
      <div className="border rounded-lg bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <span className="font-mono">{order.orderNo}</span>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                )}
              >
                {getStatusLabel(order.status)}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {orderT('orderDate')}: {formatDateTime(order.createdAt, locale === 'zh' ? 'zh-CN' : 'en-US')}
            </p>
          </div>
          <button
            onClick={handleBuyAgain}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            {locale === 'zh' ? '再次购买' : 'Buy Again'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：收货地址 + 商品列表 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 收货地址 */}
          <div className="border rounded-lg bg-card p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {orderT('shippingAddress')}
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-muted-foreground">
                {order.shippingCity}, {order.shippingState || ''} {order.shippingPostal}
              </p>
              <p className="text-muted-foreground">{order.shippingCountry}</p>
              <p className="text-muted-foreground pt-1">📞 {order.shippingPhone}</p>
              <p className="text-muted-foreground">✉️ {order.shippingEmail}</p>
            </div>
          </div>

          {/* 物流信息 */}
          {order.trackingNumber && (
            <div className="border rounded-lg bg-card p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                {orderT('trackingInfo')}
              </h2>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">
                    {orderT('trackingNumber')}:{' '}
                  </span>
                  <span className="font-mono font-medium">{order.trackingNumber}</span>
                </div>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {locale === 'zh' ? '查看物流' : 'Track Package'} →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 商品列表 */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {orderT('product')}
                <span className="text-sm font-normal text-muted-foreground">
                  ({order.items.length} {locale === 'zh' ? '件商品' : 'items'})
                </span>
              </h2>
            </div>
            <div className="divide-y">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="w-16 h-16 rounded border bg-muted shrink-0 overflow-hidden">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.productSku}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">
                      {orderT('quantity')}: {item.quantity}
                    </p>
                    <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：金额明细 */}
        <div className="space-y-6">
          <div className="border rounded-lg bg-card p-6 sticky top-24">
            <h2 className="text-base font-semibold mb-4">{orderT('orderTotal')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{orderT('subtotal')}</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{orderT('shippingFee')}</span>
                <span className="font-medium">{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{orderT('tax')}</span>
                <span className="font-medium">{formatPrice(order.taxAmount)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{orderT('discount')}</span>
                  <span className="font-medium text-green-600">
                    -{formatPrice(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold text-base">{orderT('total')}</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm">
              <p className="text-muted-foreground">
                {orderT('paymentMethod')}
              </p>
              <p className="font-medium capitalize">{order.paymentMethod || '-'}</p>
              {order.paidAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === 'zh' ? '支付时间：' : 'Paid at: '}
                  {formatDateTime(order.paidAt, locale === 'zh' ? 'zh-CN' : 'en-US')}
                </p>
              )}
            </div>

            {order.customerNote && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  {locale === 'zh' ? '订单备注' : 'Order Note'}
                </p>
                <p className="text-sm">{order.customerNote}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
