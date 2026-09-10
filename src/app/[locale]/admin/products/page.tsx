import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import AdminProductsClient from '@/components/admin/AdminProductsClient';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AdminProductsPage({
  params: { locale },
  searchParams,
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.products');

  // 解析查询参数
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const keyword = (searchParams.keyword as string) || '';
  const categoryId = (searchParams.categoryId as string) || '';
  const status = (searchParams.status as string) || '';

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

  // 查总数和产品
  const [total, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        images: {
          where: { isMain: true },
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price.toString(),
    stock: p.stock,
    status: p.status,
    featured: p.featured,
    categoryName: p.category?.name || '-',
    image: p.images[0]?.url || '',
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <AdminProductsClient
      initialProducts={formattedProducts}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialKeyword={keyword}
      initialCategoryId={categoryId}
      initialStatus={status}
      categories={categories}
    />
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin.products' });
  return { title: t('title') };
}
