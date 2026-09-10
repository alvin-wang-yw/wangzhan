import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import AdminCategoriesClient from '@/components/admin/AdminCategoriesClient';

interface Props {
  params: { locale: string };
}

export default async function AdminCategoriesPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.categories');

  // 获取所有分类
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <AdminCategoriesClient
      initialCategories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        parentId: c.parentId,
        sortOrder: c.sortOrder,
        image: c.image,
        isActive: c.isActive,
        productCount: c._count.products,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin.categories' });
  return { title: t('title') };
}
