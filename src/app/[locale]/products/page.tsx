import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import ProductListClient from '@/components/products/ProductListClient';
import ProductFilterClient from '@/components/products/ProductFilterClient';
import { Package } from 'lucide-react';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductsPage({
  params: { locale },
  searchParams,
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('product');

  // 解析参数
  const page = Number(searchParams.page) || 1;
  const pageSize = 12;
  const category = (searchParams.category as string) || '';
  const sort = (searchParams.sort as string) || 'newest';
  const keyword = (searchParams.keyword as string) || '';
  const minPrice = (searchParams.minPrice as string) || '';
  const maxPrice = (searchParams.maxPrice as string) || '';

  const skip = (page - 1) * pageSize;

  // 构建查询
  const where: Record<string, unknown> = { status: 'ACTIVE' };

  // 分类筛选
  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      include: { children: true },
    });
    if (cat) {
      const categoryIds = [cat.id];
      for (const child of cat.children) {
        categoryIds.push(child.id);
      }
      where.categoryId = { in: categoryIds };
    }
  }

  // 搜索
  if (keyword.trim()) {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
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
  const priceFilter: Record<string, number> = {};
  if (minPrice) priceFilter.gte = Number(minPrice);
  if (maxPrice) priceFilter.lte = Number(maxPrice);
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
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

  // 并行查询总数、产品、分类
  const [total, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        category: { select: { slug: true } },
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
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: { select: { products: true } },
      },
    }),
  ]);

  // 格式化产品数据
  const formattedProducts = products.map((p) => {
    const translation = p.translations[0];
    const img = p.images[0];
    return {
      id: p.id,
      name: translation?.name || p.name,
      slug: translation?.slug || p.slug,
      price: p.price.toString(),
      originalPrice: p.originalPrice?.toString() || null,
      image: img?.url || '',
      imageAlt: img?.altText || '',
      isNew: p.isNew,
      featured: p.featured,
    };
  });

  // 构建分类树
  const buildCategoryTree = (parentId: string | null = null) => {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
        children: buildCategoryTree(c.id),
      }));
  };

  const categoryTree = buildCategoryTree(null);

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('allProducts')} ({total})
        </p>
      </div>

      {/* 移动端筛选 */}
      <ProductFilterClient
        categories={categoryTree}
        currentCategory={category}
        currentSort={sort}
        currentMinPrice={minPrice}
        currentMaxPrice={maxPrice}
        currentKeyword={keyword}
        locale={locale}
      />

      {/* 产品列表主体（PC端筛选 + 网格 + 分页） */}
      {formattedProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-medium mb-2">{t('noProducts')}</h3>
          <p className="text-muted-foreground">{t('tryAdjusting')}</p>
        </div>
      ) : (
        <ProductListClient
          products={formattedProducts}
          total={total}
          page={page}
          pageSize={pageSize}
          categories={categoryTree}
          currentCategory={category}
          currentSort={sort}
          currentMinPrice={minPrice}
          currentMaxPrice={maxPrice}
          currentKeyword={keyword}
          locale={locale}
        />
      )}
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'product' });
  return { title: t('title') };
}
