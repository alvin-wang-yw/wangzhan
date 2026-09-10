'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  ShoppingBag,
  Package,
  ArrowRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

/**
 * 订单成功页客户端组件
 */
export default function OrderSuccessClient({ locale }: { locale: string }) {
  const t = useTranslations('checkout');
  const orderT = useTranslations('order');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split('/')[1] || 'en';

  const orderNo = searchParams.get('orderNo') || '';
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNo) {
      router.push(`/${currentLocale}`);
      return;
    }
    // 尝试获取订单详情（仅登录用户能获取完整信息）
    const fetchOrder = async () => {
      try {
        // 由于游客也能访问，这里只展示订单号
        // 登录用户可尝试获取详情
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          const found = data.orders?.find(
            (o: any) => o.orderNo === orderNo
          );
          if (found) setOrder(found);
        }
      } catch {
        // 忽略错误
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNo, currentLocale]);

  return (
    <div className="container py-16">
      <div className="max-w-xl mx-auto text-center">
        {/* 成功图标 */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">{t('orderSuccess')}</h1>
        <p className="text-muted-foreground mb-8">{t('orderSuccessDesc')}</p>

        {/* 订单信息卡片 */}
        <div className="border rounded-lg bg-card p-6 text-left mb-8">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <span className="text-sm text-muted-foreground">
              {t('orderNumber')}
            </span>
            <span className="font-mono font-semibold">{orderNo}</span>
          </div>

          {order && (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {orderT('orderStatus')}
                  </span>
                  <span className="font-medium text-green-600">
                    {orderT(`status.${order.status?.toLowerCase()}`)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {orderT('orderTotal')}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {/* 商品预览 */}
              {order.items && order.items.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">
                    {orderT('product')}
                  </p>
                  <div className="flex gap-2">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="w-12 h-12 rounded border bg-muted shrink-0 overflow-hidden"
                      >
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order._count?.items > 2 && (
                      <div className="w-12 h-12 rounded border bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                        +{order._count.items - 2}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${currentLocale}/products`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('continueShopping')}
          </Link>
          {order && (
            <Link
              href={`/${currentLocale}/account/orders/${order.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border rounded-md font-medium hover:bg-accent transition-colors"
            >
              {t('viewOrder')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
