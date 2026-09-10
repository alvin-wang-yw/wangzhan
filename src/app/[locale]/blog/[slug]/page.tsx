import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Eye,
  User,
  Folder,
  Share2,
  ArrowLeft,
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Tag,
} from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

interface Props {
  params: { locale: string; slug: string };
}

export default async function BlogDetailPage({
  params: { locale, slug },
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('blog');

  // 查找文章
  let post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      translations: {
        where: { locale },
        take: 1,
      },
      tagRelations: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  // 从翻译表查找
  if (!post) {
    const translation = await prisma.blogPostTranslation.findFirst({
      where: { slug, locale },
      select: { postId: true },
    });
    if (translation) {
      post = await prisma.blogPost.findUnique({
        where: { id: translation.postId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          translations: {
            where: { locale },
            take: 1,
          },
          tagRelations: {
            include: { tag: { select: { id: true, name: true, slug: true } } },
          },
        },
      });
    }
  }

  if (!post || !post.isPublished) {
    notFound();
  }

  const translation = post.translations[0];
  const displayTitle = translation?.title || post.title;
  const displaySlug = translation?.slug || post.slug;
  const displayContent = translation?.content || post.content;
  const displayExcerpt = translation?.excerpt || post.excerpt;
  const seoTitle = translation?.seoTitle || post.seoTitle;
  const seoDescription = translation?.seoDescription || post.seoDescription;
  const seoKeywords = translation?.seoKeywords || post.seoKeywords;

  const readTime = Math.max(1, Math.ceil(displayContent.length / 500));
  const tags = post.tagRelations.map((tr) => tr.tag);

  // 增加浏览量
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  // 相关文章
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      categoryId: post.categoryId,
      id: { not: post.id },
      isPublished: true,
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true, slug: true } },
      translations: {
        where: { locale },
        take: 1,
        select: { title: true, slug: true, excerpt: true },
      },
    },
  });

  const formattedRelated = relatedPosts.map((p) => {
    const tr = p.translations[0];
    return {
      id: p.id,
      title: tr?.title || p.title,
      slug: tr?.slug || p.slug,
      excerpt: tr?.excerpt || p.excerpt,
      coverImage: p.coverImage,
      category: p.category,
      createdAt: p.createdAt,
    };
  });

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: displayTitle,
    description: displayExcerpt,
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : { '@type': 'Organization', name: 'TechTrade Pro' },
    publisher: {
      '@type': 'Organization',
      name: 'TechTrade Pro',
    },
    articleSection: post.category?.name,
    keywords: seoKeywords || tags.map((t) => t.name).join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container py-10 max-w-4xl">
        {/* 返回按钮 */}
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* 文章头部 */}
        <header className="mb-8">
          {/* 分类 */}
          {post.category && (
            <Link
              href={`/${locale}/blog?category=${post.category.slug}`}
              className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline mb-3"
            >
              <Folder className="h-4 w-4" />
              {post.category.name}
            </Link>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {displayTitle}
          </h1>

          {displayExcerpt && (
            <p className="text-lg text-muted-foreground mb-6">{displayExcerpt}</p>
          )}

          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pb-6 border-b">
            <span className="inline-flex items-center gap-2">
              <User className="h-4 w-4" />
              {post.author || 'TechTrade Pro'}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('minRead', { min: readTime })}
            </span>
            <span className="inline-flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('views', { count: post.viewCount + 1 })}
            </span>
          </div>
        </header>

        {/* 封面图 */}
        {post.coverImage && (
          <div className="mb-10 rounded-lg overflow-hidden aspect-[16/9] bg-muted">
            <img
              src={post.coverImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 文章内容 */}
        <div className="prose prose-lg max-w-none mb-10">
          <div className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
            {displayContent}
          </div>
        </div>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="py-6 border-t border-b mb-10">
            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 text-sm bg-muted rounded-full text-muted-foreground hover:bg-accent cursor-pointer transition-colors"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 分享按钮 */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10 pb-10 border-b">
          <span className="text-sm font-medium inline-flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            {t('share')}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 border rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              aria-label="Share on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </button>
            <button
              className="p-2 border rounded-full hover:bg-sky-50 hover:text-sky-500 hover:border-sky-200 transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </button>
            <button
              className="p-2 border rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </button>
            <button
              className="p-2 border rounded-full hover:bg-muted transition-colors"
              aria-label="Copy link"
              onClick={() => {
                if (typeof navigator !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <LinkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 相关文章 */}
        {formattedRelated.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">{t('relatedPosts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formattedRelated.map((p) => (
                <article
                  key={p.id}
                  className="group bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all"
                >
                  <Link href={`/${locale}/blog/${p.slug}`} className="block">
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {p.coverImage ? (
                        <img
                          src={p.coverImage}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Folder className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    {p.category && (
                      <p className="text-xs text-primary mb-1">{p.category.name}</p>
                    )}
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      <Link href={`/${locale}/blog/${p.slug}`}>{p.title}</Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({ locale, namespace: 'blog' });

  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        translations: { where: { locale }, take: 1 },
        category: { select: { name: true } },
      },
    });

    if (!post) {
      const translation = await prisma.blogPostTranslation.findFirst({
        where: { slug, locale },
        select: { postId: true },
      });
      if (translation) {
        post = await prisma.blogPost.findUnique({
          where: { id: translation.postId },
          include: {
            translations: { where: { locale }, take: 1 },
            category: { select: { name: true } },
          },
        });
      }
    }
  } catch {
    // ignore
  }

  const translation = post?.translations?.[0];
  const title = translation?.title || post?.title || t('title');
  const description =
    translation?.seoDescription ||
    translation?.excerpt ||
    post?.excerpt ||
    post?.seoDescription ||
    '';
  const image = post?.coverImage;
  const keywords = translation?.seoKeywords || post?.seoKeywords;

  return {
    title: translation?.seoTitle || post?.seoTitle || title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: 'article',
      publishedTime: post?.createdAt,
      modifiedTime: post?.updatedAt,
      section: post?.category?.name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}
