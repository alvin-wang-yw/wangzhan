import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Parallel queries for all stats
    const [
      totalOrders,
      totalRevenueResult,
      totalUsers,
      totalProducts,
      todayOrders,
      todayRevenueResult,
      recentOrders,
      recentUsers,
      orderStatusCounts,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      // Total revenue (sum of total from paid+processing+shipped+delivered orders)
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: {
            in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
      }),
      // Total users
      prisma.user.count({ where: { role: 'USER' } }),
      // Total products
      prisma.product.count(),
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      }),
      // Today's revenue
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
          status: {
            in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
        },
      }),
      // Recent orders (top 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNo: true,
          total: true,
          status: true,
          createdAt: true,
          shippingName: true,
          shippingEmail: true,
        },
      }),
      // Recent users (top 10)
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      // Order status distribution
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Top selling products (by order items quantity)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'productName', 'productImage'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const totalRevenue = totalRevenueResult._sum.total
      ? Number(totalRevenueResult._sum.total)
      : 0;
    const todayRevenue = todayRevenueResult._sum.total
      ? Number(todayRevenueResult._sum.total)
      : 0;

    // Build status distribution map
    const statusDistribution: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };
    for (const item of orderStatusCounts) {
      statusDistribution[item.status] = item._count.status;
    }

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalProducts,
        todayOrders,
        todayRevenue,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        total: Number(o.total),
        status: o.status,
        customerName: o.shippingName,
        customerEmail: o.shippingEmail,
        createdAt: o.createdAt,
      })),
      recentUsers,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        productImage: p.productImage,
        totalSold: p._sum.quantity || 0,
      })),
      statusDistribution,
    });
  } catch (error) {
    console.error('[DASHBOARD_STATS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
