import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * 分类列表（树形结构）+ 产品数量统计
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取所有分类
    const categories = await prisma.category.findMany({
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
          parentId: c.parentId,
          sortOrder: c.sortOrder,
          image: c.image,
          isActive: c.isActive,
          productCount: c._count.products,
          children: buildTree(c.id),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
    };

    const tree = buildTree(null);

    return NextResponse.json({ categories: tree, total: categories.length });
  } catch (error) {
    console.error('[CATEGORIES_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * 新增分类
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description = '',
      parentId = null,
      sortOrder = 0,
      image = '',
      isActive = true,
    } = body;

    // 基础验证
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // 检查 slug 是否唯一
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // 验证父分类存在性
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        parentId: parentId || null,
        sortOrder: Number(sortOrder) || 0,
        image: image || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('[CATEGORIES_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
