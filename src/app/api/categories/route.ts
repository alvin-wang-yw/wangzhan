import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 前台分类树 API
 * 返回启用状态的分类，支持树形结构，带产品数量
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // 获取所有启用的分类
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // 构建树形结构
    const buildTree = (parentId: string | null = null) => {
      return categories
        .filter((c) => c.parentId === parentId)
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          productCount: c._count.products,
          children: buildTree(c.id),
        }));
    };

    const tree = buildTree(null);

    return NextResponse.json({
      categories: tree,
      total: categories.length,
    });
  } catch (error) {
    console.error('[CATEGORIES_FRONTEND_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
