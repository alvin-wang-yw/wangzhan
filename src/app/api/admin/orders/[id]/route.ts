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
 * 管理员获取订单详情
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('[ADMIN_ORDER_DETAIL_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * 管理员修改订单状态
 * Body: { status, trackingNumber?, trackingUrl?, adminNote? }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, trackingNumber, trackingUrl, adminNote } = body;

    if (!status || !VALID_STATUS.includes(status )) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status: status ,
    };

    // 支付状态变更时记录时间
    if (status === 'PAID' && !order.paidAt) {
      updateData.paidAt = new Date();
    }
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber || null;
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl || null;
    }
    if (adminNote !== undefined) {
      updateData.adminNote = adminNote || null;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      order: updatedOrder,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('[ADMIN_ORDER_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
