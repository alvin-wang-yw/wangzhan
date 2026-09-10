import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: { locale: string };
}

export default async function NewProductPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.products');

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
          <h1 className="text-2xl font-bold text-foreground">{t('addProduct')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('addProductSubtitle')}</p>
        </div>
      </div>

      {/* 表单 */}
      <div className="bg-card border rounded-lg p-6">
        <ProductForm
          mode="new"
          categories={categories}
          tags={tags}
          locale={locale}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin.products' });
  return { title: t('addProduct') };
}
