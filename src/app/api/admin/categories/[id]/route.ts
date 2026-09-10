import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: { id: string };
}

/**
 * 编辑分类
 */
export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      name,
      slug,
      description,
      parentId,
      sortOrder,
      image,
      isActive,
    } = body;

    // 检查分类是否存在
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // 基础验证
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 });
    }

    // 检查 slug 唯一性（排除自身）
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // 验证父分类不能是自己或自己的子分类
    if (parentId && parentId !== existing.parentId) {
      if (parentId === id) {
        return NextResponse.json(
          { error: 'Cannot set parent to itself' },
          { status: 400 }
        );
      }
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(description !== undefined && {
          description: description || null,
        }),
        ...(parentId !== undefined && {
          parentId: parentId || null,
        }),
        ...(sortOrder !== undefined && {
          sortOrder: Number(sortOrder) || 0,
        }),
        ...(image !== undefined && { image: image || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('[CATEGORIES_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * 删除分类
 */
export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // 检查分类是否存在
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // 检查是否有产品
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' },
        { status: 400 }
      );
    }

    // 检查是否有子分类
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CATEGORIES_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
