import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: { slug: string };
}

/**
 * 获取博客文章详情
 */
export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const { slug } = params;

    // 先按主表 slug 查找
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

    // 如果主表没找到，从翻译表查
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
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // 增加浏览量
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    const translation = post.translations[0];
    const displayTitle = translation?.title || post.title;
    const displaySlug = translation?.slug || post.slug;
    const displayContent = translation?.content || post.content;
    const displayExcerpt = translation?.excerpt || post.excerpt;
    const seoTitle = translation?.seoTitle || post.seoTitle;
    const seoDescription = translation?.seoDescription || post.seoDescription;
    const seoKeywords = translation?.seoKeywords || post.seoKeywords;

    const tags = post.tagRelations.map((tr) => tr.tag);

    // 阅读时间估算
    const readTime = Math.max(1, Math.ceil(displayContent.length / 500));

    // 相关文章（同分类）
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

    return NextResponse.json({
      post: {
        id: post.id,
        title: displayTitle,
        slug: displaySlug,
        content: displayContent,
        excerpt: displayExcerpt,
        coverImage: post.coverImage,
        category: post.category,
        author: post.author,
        viewCount: post.viewCount + 1,
        readTime,
        tags,
        seoTitle,
        seoDescription,
        seoKeywords,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
      relatedPosts: formattedRelated,
    });
  } catch (error) {
    console.error('[BLOG_SLUG_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
