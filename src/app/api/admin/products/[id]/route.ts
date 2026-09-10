import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';


interface RouteProps {
  params: { id: string };
}

/**
 * 获取产品详情（用于编辑）
 */
export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, altText: true, isMain: true, sortOrder: true },
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

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * 更新产品
 */
export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // 检查产品是否存在
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const {
      name,
      slug,
      sku,
      categoryId,
      price,
      originalPrice,
      costPrice,
      stock,
      minOrderQty,
      description,
      shortDesc,
      weight,
      dimensions,
      status,
      featured,
      isNew,
      seoTitle,
      seoDescription,
      seoKeywords,
      images,
      zhName,
      zhSlug,
      zhDescription,
      zhShortDesc,
      zhSeoTitle,
      zhSeoDescription,
      zhSeoKeywords,
      tags,
    } = body;

    // 验证必填项
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 });
    }
    if (sku !== undefined && !sku.trim()) {
      return NextResponse.json({ error: 'SKU cannot be empty' }, { status: 400 });
    }

    // 检查 slug 和 sku 唯一性
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }
    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku } });
      if (skuExists) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    // 构建主数据
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (sku !== undefined) updateData.sku = sku.trim();
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (price !== undefined) updateData.price = Number(price);
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? Number(originalPrice) : null;
    if (costPrice !== undefined) updateData.costPrice = costPrice ? Number(costPrice) : null;
    if (stock !== undefined) updateData.stock = Number(stock) || 0;
    if (minOrderQty !== undefined) updateData.minOrderQty = Number(minOrderQty) || 1;
    if (description !== undefined) updateData.description = description || null;
    if (shortDesc !== undefined) updateData.shortDesc = shortDesc || null;
    if (weight !== undefined) updateData.weight = weight ? Number(weight) : null;
    if (dimensions !== undefined) updateData.dimensions = dimensions || null;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (isNew !== undefined) updateData.isNew = Boolean(isNew);
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords || null;

    // 处理图片（全量替换）
    if (images !== undefined && Array.isArray(images)) {
      const productImages = images
        .filter((img: { url: string }) => img.url?.trim())
        .map((img: { url: string; altText?: string; isMain?: boolean }, index: number) => ({
          url: img.url.trim(),
          altText: img.altText || '',
          sortOrder: index + 1,
          isMain: index === 0 ? true : Boolean(img.isMain),
        }));

      if (productImages.length > 0 && !productImages.some((img: { isMain: boolean }) => img.isMain)) {
        productImages[0].isMain = true;
      }

      // 先删除旧图片再创建新图片
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (productImages.length > 0) {
        await prisma.productImage.createMany({
          data: productImages.map((img) => ({ ...img, productId: id })),
        });
      }
    }

    // 处理中文翻译
    if (zhName !== undefined || zhDescription !== undefined || zhShortDesc !== undefined) {
      const zhTranslation = await prisma.productTranslation.findUnique({
        where: { productId_locale: { productId: id, locale: 'zh' } },
      });

      const zhData = {
        name: zhName?.trim() || existing.name,
        slug: (zhSlug || slug || existing.slug).trim(),
        description: zhDescription || null,
        shortDesc: zhShortDesc || null,
        seoTitle: zhSeoTitle || null,
        seoDescription: zhSeoDescription || null,
        seoKeywords: zhSeoKeywords || null,
      };

      if (zhTranslation) {
        await prisma.productTranslation.update({
          where: { productId_locale: { productId: id, locale: 'zh' } },
          data: zhData,
        });
      } else if (zhName?.trim() || zhDescription || zhShortDesc) {
        await prisma.productTranslation.create({
          data: { ...zhData, productId: id, locale: 'zh' },
        });
      }
    }

    // 处理标签（全量替换）
    if (tags !== undefined && Array.isArray(tags)) {
      await prisma.productTagRelation.deleteMany({ where: { productId: id } });
      for (const tagId of tags) {
        const tag = await prisma.productTag.findUnique({ where: { id: tagId } });
        if (tag) {
          await prisma.productTagRelation.create({
            data: { productId: id, tagId },
          });
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        translations: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * 删除产品
 */
export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 检查是否有订单关联
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders' },
        { status: 400 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
