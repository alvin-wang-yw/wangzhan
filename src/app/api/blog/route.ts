import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 前台博客列表 API
 * 支持分类、搜索、分页
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 9;
    const category = searchParams.get('category') || '';
    const keyword = searchParams.get('keyword') || '';
    const locale = searchParams.get('locale') || 'en';

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Record<string, unknown> = {
      isPublished: true,
    };

    // 分类筛选
    if (category) {
      const cat = await prisma.blogCategory.findUnique({
        where: { slug: category },
      });
      if (cat) {
        where.categoryId = cat.id;
      } else {
        return NextResponse.json({ posts: [], total: 0, page, pageSize, totalPages: 0 });
      }
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

    // 查询总数
    const total = await prisma.blogPost.count({ where });

    // 查询文章
    const posts = await prisma.blogPost.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        translations: {
          where: { locale },
          take: 1,
          select: { title: true, slug: true, excerpt: true },
        },
      },
    });

    // 格式化数据（根据当前语言）
    const formattedPosts = posts.map((post) => {
      const translation = post.translations[0];
      const displayTitle = translation?.title || post.title;
      const displaySlug = translation?.slug || post.slug;
      const displayExcerpt = translation?.excerpt || post.excerpt;

      // 估算阅读时间（按每分钟200字）
      const wordCount = displayTitle.length + (displayExcerpt?.length || 0);
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      return {
        id: post.id,
        title: displayTitle,
        slug: displaySlug,
        excerpt: displayExcerpt,
        coverImage: post.coverImage,
        category: post.category,
        author: post.author,
        viewCount: post.viewCount,
        readTime,
        createdAt: post.createdAt,
      };
    });

    return NextResponse.json({
      posts: formattedPosts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[BLOG_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
