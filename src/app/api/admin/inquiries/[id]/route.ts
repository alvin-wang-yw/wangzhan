import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: { id: string };
}

/**
 * 获取询盘详情
 */
export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, name: true, sku: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error('[ADMIN_INQUIRY_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    );
  }
}

/**
 * 更新询盘（标记已读/已回复等）
 */
export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { isRead, isReplied } = body;

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (isRead !== undefined) updateData.isRead = Boolean(isRead);
    if (isReplied !== undefined) updateData.isReplied = Boolean(isReplied);

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error('[ADMIN_INQUIRY_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 }
    );
  }
}

/**
 * 删除询盘
 */
export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    await prisma.inquiry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_INQUIRY_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 }
    );
  }
}
