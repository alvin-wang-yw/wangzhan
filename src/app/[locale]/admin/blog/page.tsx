import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import AdminBlogClient from '@/components/admin/AdminBlogClient';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AdminBlogPage({
  params: { locale },
  searchParams,
}: Props) {
  setRequestLocale(locale);

  // 解析查询参数
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const keyword = (searchParams.keyword as string) || '';
  const categoryId = (searchParams.categoryId as string) || '';
  const isPublished = (searchParams.isPublished as string) || '';

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: Record<string, unknown> = {};

  if (keyword.trim()) {
    where.OR = [
      { title: { contains: keyword } },
      { slug: { contains: keyword } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (isPublished !== '') {
    where.isPublished = isPublished === 'true';
  }

  // 查总数和文章
  const [total, posts, categories] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);

  const formattedPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    categoryName: p.category?.name || '-',
    author: p.author || '-',
    isPublished: p.isPublished,
    viewCount: p.viewCount,
    coverImage: p.coverImage || '',
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <AdminBlogClient
      initialPosts={formattedPosts}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialKeyword={keyword}
      initialCategoryId={categoryId}
      initialIsPublished={isPublished}
      categories={categories}
    />
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin.blog' });
  return { title: t('title') };
}
