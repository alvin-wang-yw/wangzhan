import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Calendar,
  Clock,
  Eye,
  Folder,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BlogListPage({
  params: { locale },
  searchParams,
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('blog');

  const page = Number(searchParams.page) || 1;
  const pageSize = 9;
  const category = (searchParams.category as string) || '';
  const keyword = (searchParams.keyword as string) || '';

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: Record<string, unknown> = {
    isPublished: true,
  };

  // 分类筛选
  let categoryData = null;
  if (category) {
    categoryData = await prisma.blogCategory.findUnique({ where: { slug: category } });
    if (!categoryData) {
      notFound();
    }
    where.categoryId = categoryData.id;
  }

  // 关键词搜索
  if (keyword.trim()) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { excerpt: { contains: keyword, mode: 'insensitive' } },
      {
        translations: {
          some: {
            locale,
            title: { contains: keyword, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  // 查询
  const [total, posts, categories, popularPosts, allTags] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        translations: {
          where: { locale },
          take: 1,
          select: { title: true, slug: true, excerpt: true },
        },
      },
    }),
    prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { posts: { where: { isPublished: true } } } } },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      take: 5,
      orderBy: { viewCount: 'desc' },
      include: {
        translations: {
          where: { locale },
          take: 1,
          select: { title: true, slug: true },
        },
      },
    }),
    prisma.blogTag.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // 格式化文章
  const formattedPosts = posts.map((post) => {
    const tr = post.translations[0];
    const title = tr?.title || post.title;
    const slug = tr?.slug || post.slug;
    const excerpt = tr?.excerpt || post.excerpt;
    const readTime = Math.max(1, Math.ceil((excerpt?.length || 0 + title.length) / 200));

    return {
      id: post.id,
      title,
      slug,
      excerpt,
      coverImage: post.coverImage,
      category: post.category,
      author: post.author,
      viewCount: post.viewCount,
      readTime,
      createdAt: post.createdAt,
    };
  });

  // 格式化热门文章
  const formattedPopular = popularPosts.map((p) => {
    const tr = p.translations[0];
    return {
      id: p.id,
      title: tr?.title || p.title,
      slug: tr?.slug || p.slug,
      viewCount: p.viewCount,
      coverImage: p.coverImage,
    };
  });

  return (
    <div className="container py-10">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {categoryData ? categoryData.name : t('allPosts')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧文章列表 */}
        <div className="lg:col-span-2">
          {/* 搜索框（移动端显示） */}
          <div className="lg:hidden mb-6">
            <form action={`/${locale}/blog`} method="get">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="keyword"
                  defaultValue={keyword}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </form>
          </div>

          {/* 文章列表 */}
          {formattedPosts.length === 0 ? (
            <div className="text-center py-16 bg-card border rounded-lg">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-2">{t('noPosts')}</h3>
              <p className="text-sm text-muted-foreground">{t('tryAdjusting')}</p>
              <Link
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-1 mt-4 text-primary hover:underline text-sm"
              >
                {t('backToBlog')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {formattedPosts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all"
                >
                  {/* 封面图 */}
                  <Link href={`/${locale}/blog/${post.slug}`} className="block">
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* 内容 */}
                  <div className="p-5">
                    {/* 分类 */}
                    {post.category && (
                      <Link
                        href={`/${locale}/blog?category=${post.category.slug}`}
                        className="inline-block text-xs font-medium text-primary hover:underline mb-2"
                      >
                        <Folder className="h-3 w-3 inline mr-1 -mt-0.5" />
                        {post.category.name}
                      </Link>
                    )}

                    <h2 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      <Link href={`/${locale}/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* 元信息 */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {t('minRead', { min: post.readTime })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.viewCount}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/${locale}/blog?page=${page - 1}${keyword ? `&keyword=${keyword}` : ''}${category ? `&category=${category}` : ''}`}
                  className="p-2 border rounded-md hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (page > 3) pageNum = page - 2 + i;
                  if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                }
                return (
                  <Link
                    key={pageNum}
                    href={`/${locale}/blog?page=${pageNum}${keyword ? `&keyword=${keyword}` : ''}${category ? `&category=${category}` : ''}`}
                    className={`w-10 h-10 rounded-md text-sm font-medium inline-flex items-center justify-center transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link
                  href={`/${locale}/blog?page=${page + 1}${keyword ? `&keyword=${keyword}` : ''}${category ? `&category=${category}` : ''}`}
                  className="p-2 border rounded-md hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 右侧边栏 */}
        <aside className="space-y-6">
          {/* 搜索 */}
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold mb-4">{t('searchPlaceholder').replace('...', '')}</h3>
            <form action={`/${locale}/blog`} method="get">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="keyword"
                  defaultValue={keyword}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </form>
          </div>

          {/* 分类列表 */}
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold mb-4">{t('categories')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/blog`}
                  className={`flex items-center justify-between text-sm py-1.5 hover:text-primary transition-colors ${
                    !category ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {t('allPosts')}
                  <span className="text-xs">{total}</span>
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${locale}/blog?category=${cat.slug}`}
                    className={`flex items-center justify-between text-sm py-1.5 hover:text-primary transition-colors ${
                      category === cat.slug ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {cat.name}
                    <span className="text-xs">{cat._count.posts}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 热门文章 */}
          <div className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold mb-4">Popular Posts</h3>
            <ul className="space-y-3">
              {formattedPopular.map((post, index) => (
                <li key={post.id}>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="flex gap-3 group"
                  >
                    <span className="text-2xl font-bold text-primary/20 group-hover:text-primary/40 transition-colors w-8">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Eye className="h-3 w-3 inline mr-1 -mt-0.5" />
                        {post.viewCount} views
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 标签云 */}
          {allTags.length > 0 && (
            <div className="bg-card border rounded-lg p-5">
              <h3 className="font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations({ locale, namespace: 'blog' });
  const category = (searchParams.category as string) || '';
  const keyword = (searchParams.keyword as string) || '';

  let title = t('title');
  let description = '';

  if (category) {
    const cat = await prisma.blogCategory.findUnique({ where: { slug: category } });
    if (cat) {
      title = `${cat.name} - ${t('title')}`;
      description = cat.description || '';
    }
  }

  if (keyword) {
    title = `${keyword} - ${t('title')}`;
    description = `Search results for "${keyword}"`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}
