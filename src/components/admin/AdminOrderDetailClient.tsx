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
  Truck,
  Download,
  Loader2,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const ALL_STATUSES = [
  { value: 'PENDING', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'PAID', color: 'bg-green-100 text-green-700' },
  { value: 'PROCESSING', color: 'bg-blue-100 text-blue-700' },
  { value: 'SHIPPED', color: 'bg-purple-100 text-purple-700' },
  { value: 'DELIVERED', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'CANCELLED', color: 'bg-red-100 text-red-700' },
  { value: 'REFUNDED', color: 'bg-gray-100 text-gray-700' },
];

/**
 * 管理员订单详情 - 客户端组件
 */
export default function AdminOrderDetailClient({
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setTrackingNumber(data.order.trackingNumber || '');
        setTrackingUrl(data.order.trackingUrl || '');
        setAdminNote(data.order.adminNote || '');
      } else {
        setError(data.error || 'Failed to load order');
      }
    } catch (err) {
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

  const getStatusColor = (status: string) => {
    return ALL_STATUSES.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-700';
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusDropdownOpen(false);
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber,
          trackingUrl,
          adminNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch {
      setError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLogistics = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: order.status,
          trackingNumber,
          trackingUrl,
          adminNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!order) return;
    // 简单导出为文本
    const content = `
Order: ${order.orderNo}
Status: ${order.status}
Date: ${new Date(order.createdAt).toLocaleString()}
Customer: ${order.shippingName} (${order.shippingEmail})
Phone: ${order.shippingPhone}

Shipping Address:
${order.shippingAddress}

Items:
${order.items.map((item: any) => `${item.productName} x ${item.quantity} - ${formatPrice(item.subtotal)}`).join('\n')}

Subtotal: ${formatPrice(order.subtotal)}
Shipping: ${formatPrice(order.shippingFee)}
Tax: ${formatPrice(order.taxAmount)}
Discount: ${formatPrice(order.discountAmount)}
Total: ${formatPrice(order.total)}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.orderNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive">{error}</p>
        <Link
          href={`/${currentLocale}/admin/orders`}
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
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${currentLocale}/admin/orders`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === 'zh' ? '返回订单列表' : 'Back to orders'}
        </Link>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
        >
          <Download className="h-4 w-4" />
          {locale === 'zh' ? '导出订单' : 'Export Order'}
        </button>
      </div>

      {/* 订单头部 */}
      <div className="border rounded-lg bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <span className="font-mono">{order.orderNo}</span>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  getStatusColor(order.status)
                )}
              >
                {getStatusLabel(order.status)}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {orderT('orderDate')}: {formatDateTime(order.createdAt, locale === 'zh' ? 'zh-CN' : 'en-US')}
            </p>
          </div>

          {/* 状态修改下拉 */}
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {locale === 'zh' ? '修改状态' : 'Change Status'}
            </button>
            {statusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setStatusDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md z-50">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors flex items-center gap-2',
                        order.status === s.value && 'bg-accent font-medium'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          s.color.replace('bg-', 'bg-').replace('text-', '')
                        )}
                        style={{
                          backgroundColor:
                            s.value === 'PENDING' ? '#eab308' :
                            s.value === 'PAID' ? '#22c55e' :
                            s.value === 'PROCESSING' ? '#3b82f6' :
                            s.value === 'SHIPPED' ? '#a855f7' :
                            s.value === 'DELIVERED' ? '#10b981' :
                            s.value === 'CANCELLED' ? '#ef4444' : '#6b7280',
                        }}
                      />
                      {getStatusLabel(s.value)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：客户信息 + 收货地址 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 客户信息 */}
          <div className="border rounded-lg bg-card p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {orderT('customerInfo')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{locale === 'zh' ? '姓名' : 'Name'}</p>
                <p className="font-medium">{order.shippingName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{orderT('paymentMethod')}</p>
                <p className="font-medium capitalize">{order.paymentMethod || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.shippingEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{locale === 'zh' ? '电话' : 'Phone'}</p>
                <p className="font-medium">{order.shippingPhone}</p>
              </div>
              {order.shippingCompany && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">{locale === 'zh' ? '公司' : 'Company'}</p>
                  <p className="font-medium">{order.shippingCompany}</p>
                </div>
              )}
            </div>
          </div>

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
            </div>
          </div>

          {/* 物流信息 */}
          <div className="border rounded-lg bg-card p-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {orderT('trackingInfo')}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {orderT('trackingNumber')}
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={locale === 'zh' ? '输入物流单号' : 'Enter tracking number'}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {locale === 'zh' ? '物流链接' : 'Tracking URL'}
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {locale === 'zh' ? '管理员备注' : 'Admin Note'}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder={locale === 'zh' ? '内部备注信息' : 'Internal notes...'}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <button
                onClick={handleSaveLogistics}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {locale === 'zh' ? '保存' : 'Save'}
              </button>
            </div>
          </div>

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                      {orderT('product')}
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {orderT('price')}
                    </th>
                    <th className="text-center px-6 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {orderT('quantity')}
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {orderT('subtotal')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded border bg-muted shrink-0 overflow-hidden">
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
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.productSku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatPrice(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            {order.customerNote && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  {locale === 'zh' ? '客户备注' : 'Customer Note'}
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
