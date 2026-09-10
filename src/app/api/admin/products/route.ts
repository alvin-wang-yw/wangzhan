import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';


/**
 * 产品列表（分页、搜索、筛选）
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
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (keyword.trim()) {
      where.OR = [
        { name: { contains: keyword } },
        { sku: { contains: keyword } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status && ['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)) {
      where.status = status;
    }

    // 查询总数
    const total = await prisma.product.count({ where });

    // 查询产品列表
    const products = await prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          where: { isMain: true },
          take: 1,
          select: { url: true, altText: true },
        },
      },
    });

    return NextResponse.json({
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * 新增产品
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
      sku,
      categoryId,
      price,
      originalPrice = null,
      costPrice = null,
      stock = 0,
      minOrderQty = 1,
      description = '',
      shortDesc = '',
      weight = null,
      dimensions = '',
      status = 'DRAFT',
      featured = false,
      isNew = false,
      seoTitle = '',
      seoDescription = '',
      seoKeywords = '',
      images = [],
      zhName = '',
      zhSlug = '',
      zhDescription = '',
      zhShortDesc = '',
      zhSeoTitle = '',
      zhSeoDescription = '',
      zhSeoKeywords = '',
      tags = [],
    } = body;

    // 基础验证
    if (!name?.trim()) {
      return NextResponse.json({ error: 'English name is required' }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }
    if (!sku?.trim()) {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json({ error: 'Price is required' }, { status: 400 });
    }

    // 检查 slug 和 sku 唯一性
    const [slugExists, skuExists] = await Promise.all([
      prisma.product.findUnique({ where: { slug: slug.trim() } }),
      prisma.product.findUnique({ where: { sku: sku.trim() } }),
    ]);

    if (slugExists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    if (skuExists) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    // 验证分类存在
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
    }

    // 处理图片数据
    const productImages = Array.isArray(images)
      ? images
          .filter((img: { url: string }) => img.url?.trim())
          .map((img: { url: string; altText?: string; isMain?: boolean }, index: number) => ({
            url: img.url.trim(),
            altText: img.altText || '',
            sortOrder: index + 1,
            isMain: index === 0 ? true : Boolean(img.isMain),
          }))
      : [];

    // 确保至少有一个主图
    if (productImages.length > 0 && !productImages.some((img: { isMain: boolean }) => img.isMain)) {
      productImages[0].isMain = true;
    }

    // 处理翻译数据
    const translations = [];
    if (zhName?.trim() || zhSlug?.trim() || zhDescription || zhShortDesc) {
      translations.push({
        locale: 'zh',
        name: zhName.trim() || name.trim(),
        slug: (zhSlug || slug).trim(),
        description: zhDescription || null,
        shortDesc: zhShortDesc || null,
        seoTitle: zhSeoTitle || null,
        seoDescription: zhSeoDescription || null,
        seoKeywords: zhSeoKeywords || null,
      });
    }

    // 处理标签
    const tagRelations: { tagId: string }[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        const tag = await prisma.productTag.findUnique({ where: { id: tagId } });
        if (tag) {
          tagRelations.push({ tagId });
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
        categoryId,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        costPrice: costPrice ? Number(costPrice) : null,
        stock: Number(stock) || 0,
        minOrderQty: Number(minOrderQty) || 1,
        description: description || null,
        shortDesc: shortDesc || null,
        weight: weight ? Number(weight) : null,
        dimensions: dimensions || null,
        status: status || 'DRAFT',
        featured: Boolean(featured),
        isNew: Boolean(isNew),
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        images: {
          create: productImages,
        },
        translations: {
          create: translations,
        },
        tagRelations: {
          create: tagRelations,
        },
      },
      include: {
        category: true,
        images: true,
        translations: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
