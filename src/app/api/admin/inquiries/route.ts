import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * 询盘列表（分页、搜索、筛选）
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
    const isRead = searchParams.get('isRead') || '';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (keyword.trim()) {
      where.OR = [
        { name: { contains: keyword } },
        { email: { contains: keyword } },
        { subject: { contains: keyword } },
        { message: { contains: keyword } },
      ];
    }

    if (isRead !== '') {
      where.isRead = isRead === 'true';
    }

    // 查询总数
    const total = await prisma.inquiry.count({ where });

    // 查询询盘列表
    const inquiries = await prisma.inquiry.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    return NextResponse.json({
      inquiries,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[ADMIN_INQUIRIES_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}
