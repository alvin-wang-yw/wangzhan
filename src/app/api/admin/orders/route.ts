import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';


const VALID_STATUS: string[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

/**
 * 管理员获取订单列表
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (keyword.trim()) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { shippingEmail: { contains: keyword } },
        { shippingName: { contains: keyword } },
      ];
    }

    if (status && VALID_STATUS.includes(status )) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {} as Record<string, Date>;
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(dateTo + 'T23:59:59');
      }
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNo: true,
        status: true,
        total: true,
        paymentMethod: true,
        shippingName: true,
        shippingEmail: true,
        createdAt: true,
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[ADMIN_ORDERS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
