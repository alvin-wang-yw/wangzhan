import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 前台产品列表 API
 * 支持分类、价格区间、排序、分页、搜索
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 12;
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';
    const keyword = searchParams.get('keyword') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const featured = searchParams.get('featured') || '';
    const locale = searchParams.get('locale') || 'en';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
    };

    // 分类筛选（支持子分类）
    if (category) {
      // 先找到该分类及其所有子分类 ID
      const cat = await prisma.category.findUnique({
        where: { slug: category },
        include: { children: true },
      });

      if (cat) {
        const categoryIds = [cat.id];
        // 只查一层子分类（简单场景够用）
        for (const child of cat.children) {
          categoryIds.push(child.id);
        }
        where.categoryId = { in: categoryIds };
      } else {
        return NextResponse.json({ products: [], total: 0, page, pageSize, totalPages: 0 });
      }
    }

    // 关键词搜索
    if (keyword.trim()) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { sku: { contains: keyword, mode: 'insensitive' } },
        {
          translations: {
            some: {
              locale,
              name: { contains: keyword, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // 价格区间
    if (minPrice) {
      where.price = { ...(where.price as object || {}), gte: Number(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...(where.price as object || {}), lte: Number(maxPrice) };
    }

    // 推荐产品
    if (featured === 'true') {
      where.featured = true;
    }

    // 排序
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // 查询总数
    const total = await prisma.product.count({ where });

    // 查询产品
    const products = await prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          where: { isMain: true },
          take: 1,
          select: { url: true, altText: true },
        },
        translations: {
          where: { locale },
          take: 1,
          select: { name: true, slug: true, shortDesc: true },
        },
      },
    });

    // 格式化产品数据（根据当前语言）
    const formattedProducts = products.map((product) => {
      const translation = product.translations[0];
      const mainImage = product.images[0];

      return {
        id: product.id,
        name: translation?.name || product.name,
        slug: translation?.slug || product.slug,
        sku: product.sku,
        price: product.price,
        originalPrice: product.originalPrice,
        shortDesc: translation?.shortDesc || product.shortDesc,
        featured: product.featured,
        isNew: product.isNew,
        category: product.category,
        image: mainImage?.url || '',
        imageAlt: mainImage?.altText || '',
        createdAt: product.createdAt,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[PRODUCTS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
