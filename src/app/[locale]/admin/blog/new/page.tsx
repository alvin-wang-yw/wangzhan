import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import BlogForm from '@/components/admin/BlogForm';

interface Props {
  params: { locale: string };
}

export default async function AdminBlogNewPage({ params: { locale } }: Props) {
  setRequestLocale(locale);

  const categories = await prisma.blogCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });

  return (
    <BlogForm
      mode="new"
      categories={categories}
      locale={locale}
    />
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin.blog' });
  return { title: t('addPost') };
}
