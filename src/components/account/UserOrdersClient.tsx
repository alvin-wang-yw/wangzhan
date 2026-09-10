'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  orderNo: string;
  status: string;
  total: string;
  createdAt: string;
  items: { id: string; productName: string; productImage: string | null }[];
  _count: { items: number };
}

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
 * 用户订单列表 - 客户端组件
 */
export default function UserOrdersClient({ locale }: { locale: string }) {
  const t = useTranslations('account');
  const orderT = useTranslations('order');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'en';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const getStatusLabel = (s: string) => {
    try {
      return orderT(`status.${s.toLowerCase()}`);
    } catch {
      return s;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border rounded-lg bg-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{t('noOrders')}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {locale === 'zh' ? '您还没有任何订单' : "You haven't placed any orders yet"}
        </p>
        <Link
          href={`/${currentLocale}/products`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          {locale === 'zh' ? '去购物' : 'Go Shopping'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">{t('orders')}</h1>
        <span className="text-sm text-muted-foreground">
          {locale === 'zh' ? `共 ${total} 个订单` : `${total} orders total`}
        </span>
      </div>

      {/* 订单列表 */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-lg bg-card overflow-hidden hover:border-primary/30 transition-colors"
          >
            {/* 订单头部 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-xs text-muted-foreground">
                    {orderT('orderNo')}
                  </span>
                  <p className="font-mono font-medium text-sm">{order.orderNo}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    {orderT('orderDate')}
                  </span>
                  <p className="text-sm font-medium">
                    {formatDate(order.createdAt, locale === 'zh' ? 'zh-CN' : 'en-US')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {/* 商品预览 */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="w-12 h-12 rounded border-2 border-card bg-muted shrink-0 overflow-hidden"
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
                  {order._count.items > 3 && (
                    <div className="w-12 h-12 rounded border-2 border-card bg-muted shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                      +{order._count.items - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  {order._count.items} {locale === 'zh' ? '件商品' : 'items'}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {orderT('orderTotal')}
                  </p>
                  <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                </div>
              </div>
            </div>

            {/* 操作 */}
            <div className="px-4 py-2 border-t bg-muted/20 flex justify-end">
              <Link
                href={`/${currentLocale}/account/orders/${order.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
              >
                <Eye className="h-4 w-4" />
                {orderT('orderDetails')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            {locale === 'zh'
              ? `第 ${page} / ${totalPages} 页`
              : `Page ${page} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
