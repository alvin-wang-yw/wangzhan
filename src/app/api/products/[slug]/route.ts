import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: { slug: string };
}

/**
 * 产品详情 API
 * 根据 slug 获取产品详情，支持多语言
 */
export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const { slug } = params;

    // 先按主表 slug 查找
    let product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, altText: true, isMain: true },
        },
        translations: {
          select: {
            locale: true,
            name: true,
            slug: true,
            description: true,
            shortDesc: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
          },
        },
        tagRelations: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    // 如果主表没找到，尝试从翻译表查
    if (!product) {
      const translation = await prisma.productTranslation.findFirst({
        where: { slug, locale },
        select: { productId: true },
      });

      if (translation) {
        product = await prisma.product.findUnique({
          where: { id: translation.productId },
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, altText: true, isMain: true },
            },
            translations: {
              select: {
                locale: true,
                name: true,
                slug: true,
                description: true,
                shortDesc: true,
                seoTitle: true,
                seoDescription: true,
                seoKeywords: true,
              },
            },
            tagRelations: {
              include: {
                tag: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        });
      }
    }

    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 获取当前语言的翻译
    const translation = product.translations.find((t) => t.locale === locale);

    // 相关产品（同分类其他产品）
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'ACTIVE',
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
          select: { url: true, altText: true },
        },
        translations: {
          where: { locale },
          take: 1,
          select: { name: true, slug: true },
        },
      },
    });

    const formattedRelated = relatedProducts.map((p) => {
      const t = p.translations[0];
      const img = p.images[0];
      return {
        id: p.id,
        name: t?.name || p.name,
        slug: t?.slug || p.slug,
        price: p.price,
        originalPrice: p.originalPrice,
        image: img?.url || '',
        imageAlt: img?.altText || '',
      };
    });

    // 组装返回数据
    const result = {
      id: product.id,
      name: translation?.name || product.name,
      slug: translation?.slug || product.slug,
      sku: product.sku,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      minOrderQty: product.minOrderQty,
      description: translation?.description || product.description,
      shortDesc: translation?.shortDesc || product.shortDesc,
      weight: product.weight,
      dimensions: product.dimensions,
      featured: product.featured,
      isNew: product.isNew,
      category: product.category,
      images: product.images,
      tags: product.tagRelations.map((tr) => tr.tag),
      seo: {
        title: translation?.seoTitle || product.seoTitle,
        description: translation?.seoDescription || product.seoDescription,
        keywords: translation?.seoKeywords || product.seoKeywords,
      },
      relatedProducts: formattedRelated,
      createdAt: product.createdAt,
    };

    return NextResponse.json({ product: result });
  } catch (error) {
    console.error('[PRODUCT_DETAIL_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
