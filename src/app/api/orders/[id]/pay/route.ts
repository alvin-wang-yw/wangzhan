import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';


/**
 * 模拟支付（POST）
 * 模拟支付成功，将订单状态从 PENDING 更新为 PAID
 * 真实场景应集成 Stripe Webhook 或支付回调
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    // 查找订单
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 校验订单归属（管理员或订单所有者）
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 仅待付款订单可以支付
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order is not pending payment' },
        { status: 400 }
      );
    }

    // 模拟支付成功 - 更新订单状态
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID' ,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNo: updatedOrder.orderNo,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt,
      },
      message: 'Payment successful (simulated)',
    });
  } catch (error) {
    console.error('[ORDER_PAY]', error);
    return NextResponse.json(
      { error: 'Payment failed' },
      { status: 500 }
    );
  }
}
