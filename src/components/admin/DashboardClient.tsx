'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Loader2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { formatPrice, formatDateTime } from '@/lib/utils';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  todayOrders: number;
  todayRevenue: number;
}

interface RecentOrder {
  id: string;
  orderNo: string;
  total: number;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface TopProduct {
  productId: string | null;
  productName: string;
  productImage: string | null;
  totalSold: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  recentUsers: RecentUser[];
  topProducts: TopProduct[];
  statusDistribution: Record<string, number>;
}

interface DashboardClientProps {
  locale: string;
}

export default function DashboardClient({ locale }: DashboardClientProps) {
  const t = useTranslations('admin');
  const td = useTranslations('admin.dashboard');
  const orderT = useTranslations('order.status');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error('Fetch dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = data
    ? [
        {
          label: td('todayOrders'),
          value: data.stats.todayOrders,
          icon: ShoppingCart,
          color: 'bg-blue-500',
        },
        {
          label: td('todayRevenue'),
          value: formatPrice(data.stats.todayRevenue, { locale: locale === 'zh' ? 'zh-CN' : 'en-US' }),
          icon: DollarSign,
          color: 'bg-green-500',
        },
        {
          label: t('stats.totalOrders'),
          value: data.stats.totalOrders,
          icon: ShoppingCart,
          color: 'bg-purple-500',
        },
        {
          label: t('stats.totalRevenue'),
          value: formatPrice(data.stats.totalRevenue, { locale: locale === 'zh' ? 'zh-CN' : 'en-US' }),
          icon: TrendingUp,
          color: 'bg-orange-500',
        },
        {
          label: t('stats.totalUsers'),
          value: data.stats.totalUsers,
          icon: Users,
          color: 'bg-cyan-500',
        },
        {
          label: t('stats.totalProducts'),
          value: data.stats.totalProducts,
          icon: Package,
          color: 'bg-pink-500',
        },
      ]
    : [];

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    PAID: 'bg-green-500',
    PROCESSING: 'bg-blue-500',
    SHIPPED: 'bg-indigo-500',
    DELIVERED: 'bg-emerald-500',
    CANCELLED: 'bg-red-500',
    REFUNDED: 'bg-gray-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('stats.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`${stat.color} text-white p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最近订单 + 最近用户 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{td('recentOrders') || t('recentOrders')}</h3>
            <Link
              href={`/${locale}/admin/orders`}
              className="text-sm text-primary hover:underline"
            >
              {td('viewAll')} →
            </Link>
          </div>
          {data?.recentOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{td('noOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/${locale}/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {order.orderNo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-foreground">
                      {formatPrice(order.total, { locale: locale === 'zh' ? 'zh-CN' : 'en-US' })}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full text-white ${
                        statusColors[order.status] || 'bg-gray-500'
                      }`}
                    >
                      {orderT(order.status.toLowerCase() as any) || order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最近注册用户 */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{td('recentUsers')}</h3>
          </div>
          {data?.recentUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{td('noUsers')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.createdAt).toLocaleDateString(
                        locale === 'zh' ? 'zh-CN' : 'en-US'
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 热销产品 + 订单状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热销产品 TOP 5 */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{td('topProducts')}</h3>
          {data?.topProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{td('noProducts')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.topProducts.map((product, index) => (
                <div
                  key={product.productId || index}
                  className="flex items-center gap-3 p-2 rounded-md"
                >
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  {product.productImage && (
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {td('unitsSold')}: {product.totalSold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 订单状态分布 */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{td('orderStatusDistribution')}</h3>
          {data ? (
            <div className="space-y-4">
              {Object.entries(data.statusDistribution).map(([status, count]) => {
                const total = Object.values(data.statusDistribution).reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            statusColors[status] || 'bg-gray-400'
                          }`}
                        />
                        {orderT(status.toLowerCase() as any) || status}
                      </span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          statusColors[status] || 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
