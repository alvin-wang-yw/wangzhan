'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Calendar,
} from 'lucide-react';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  orderNo: string;
  status: string;
  total: string;
  paymentMethod: string;
  shippingName: string;
  shippingEmail: string;
  createdAt: string;
  _count: { items: number };
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

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
 * 管理员订单列表 - 客户端组件
 */
export default function AdminOrdersClient({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const orderT = useTranslations('order');
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split('/')[1] || 'en';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set('keyword', keyword);
      if (status) params.set('status', status);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
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
  }, [page, status, dateFrom, dateTo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleReset = () => {
    setKeyword('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const getStatusLabel = (s: string) => {
    try {
      return orderT(`status.${s.toLowerCase()}`);
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('sidebar.orders')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === 'zh' ? `共 ${total} 条订单` : `${total} orders total`}
          </p>
        </div>
      </div>

      {/* 搜索筛选 */}
      <div className="border rounded-lg bg-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('products.search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={locale === 'zh' ? '搜索订单号/邮箱/姓名' : 'Search by order no, email, name...'}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {orderT('orderStatus')}
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === ''
                    ? locale === 'zh' ? '全部状态' : 'All Status'
                    : getStatusLabel(opt.value)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {locale === 'zh' ? '开始日期' : 'From Date'}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            />
          </div>

          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {locale === 'zh' ? '结束日期' : 'To Date'}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {locale === 'zh' ? '筛选' : 'Filter'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            {locale === 'zh' ? '重置' : 'Reset'}
          </button>
        </form>
      </div>

      {/* 订单表格 */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {orderT('orderNo')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {locale === 'zh' ? '客户' : 'Customer'}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {orderT('orderTotal')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {orderT('orderStatus')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {orderT('paymentMethod')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {orderT('orderDate')}
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                  {t('products.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {t('products.noProducts') && 'Loading...'}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {locale === 'zh' ? '暂无订单' : 'No orders found'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">
                      {order.orderNo}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.shippingName}</p>
                      <p className="text-xs text-muted-foreground">{order.shippingEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {order.paymentMethod || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(order.createdAt, locale === 'zh' ? 'zh-CN' : 'en-US')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/${currentLocale}/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        {locale === 'zh' ? '详情' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              {locale === 'zh'
                ? `共 ${total} 条，第 ${page} / ${totalPages} 页`
                : `${total} total, page ${page} of ${totalPages}`}
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
    </div>
  );
}
