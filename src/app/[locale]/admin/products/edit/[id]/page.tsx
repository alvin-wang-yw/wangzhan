import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: { locale: string; id: string };
}

export default async function EditProductPage({
  params: { locale, id },
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.products');

  // 获取产品详情
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
        select: { url: true, altText: true, isMain: true },
      },
      translations: {
        where: { locale: 'zh' },
        take: 1,
      },
      tagRelations: {
        select: { tagId: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.productTag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const zhTranslation = product.translations[0];

  const initialData = {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description || '',
    shortDesc: product.shortDesc || '',
    zhName: zhTranslation?.name || '',
    zhSlug: zhTranslation?.slug || '',
    zhDescription: zhTranslation?.description || '',
    zhShortDesc: zhTranslation?.shortDesc || '',
    price: product.price.toString(),
    originalPrice: product.originalPrice?.toString() || '',
    costPrice: product.costPrice?.toString() || '',
    stock: product.stock.toString(),
    minOrderQty: product.minOrderQty.toString(),
    weight: product.weight?.toString() || '',
    dimensions: product.dimensions || '',
    categoryId: product.categoryId,
    status: product.status,
    featured: product.featured,
    isNew: product.isNew,
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    seoKeywords: product.seoKeywords || '',
    zhSeoTitle: zhTranslation?.seoTitle || '',
    zhSeoDescription: zhTranslation?.seoDescription || '',
    zhSeoKeywords: zhTranslation?.seoKeywords || '',
    images: product.images.map((img) => ({
      url: img.url,
      altText: img.altText || '',
      isMain: img.isMain,
    })),
    tagIds: product.tagRelations.map((tr) => tr.tagId),
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/products`}
          className="p-2 hover:bg-muted rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('editProduct')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
        </div>
      </div>

      {/* 表单 */}
      <div className="bg-card border rounded-lg p-6">
        <ProductForm
          mode="edit"
          productId={id}
          categories={categories}
          tags={tags}
          initialData={initialData}
          locale={locale}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'admin.products' });
  return { title: t('editProduct') };
}
