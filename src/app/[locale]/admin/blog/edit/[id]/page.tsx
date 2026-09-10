import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import BlogForm from '@/components/admin/BlogForm';

interface Props {
  params: { locale: string; id: string };
}

export default async function AdminBlogEditPage({ params: { locale, id } }: Props) {
  setRequestLocale(locale);

  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        translations: {
          where: { locale: 'zh' },
          take: 1,
          select: {
            title: true,
            slug: true,
            content: true,
            excerpt: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
          },
        },
        tagRelations: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);

  if (!post) {
    notFound();
  }

  const zhTranslation = post.translations[0];
  const tagIds = post.tagRelations.map((tr) => tr.tag.id);

  const initialData = {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt || '',
    zhTitle: zhTranslation?.title || '',
    zhSlug: zhTranslation?.slug || '',
    zhContent: zhTranslation?.content || '',
    zhExcerpt: zhTranslation?.excerpt || '',
    coverImage: post.coverImage || '',
    categoryId: post.categoryId || '',
    author: post.author || '',
    isPublished: post.isPublished,
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
    seoKeywords: post.seoKeywords || '',
    zhSeoTitle: zhTranslation?.seoTitle || '',
    zhSeoDescription: zhTranslation?.seoDescription || '',
    zhSeoKeywords: zhTranslation?.seoKeywords || '',
    tagIds,
  };

  return (
    <BlogForm
      mode="edit"
      postId={id}
      categories={categories}
      initialData={initialData}
      locale={locale}
    />
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string; id: string };
}) {
  const t = await getTranslations({ locale, namespace: 'admin.blog' });
  return { title: t('editPost') };
}
