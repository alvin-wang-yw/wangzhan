import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * 博客文章列表（分页、搜索、筛选）
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const keyword = searchParams.get('keyword') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const isPublished = searchParams.get('isPublished') || '';

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

    // 查询总数
    const total = await prisma.blogPost.count({ where });

    // 查询文章列表
    const posts = await prisma.blogPost.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[ADMIN_BLOG_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

/**
 * 新增博客文章
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt = '',
      coverImage = '',
      categoryId = null,
      author = '',
      isPublished = true,
      seoTitle = '',
      seoDescription = '',
      seoKeywords = '',
      // 中文翻译
      zhTitle = '',
      zhSlug = '',
      zhContent = '',
      zhExcerpt = '',
      zhSeoTitle = '',
      zhSeoDescription = '',
      zhSeoKeywords = '',
    } = body;

    // 基础验证
    if (!title?.trim()) {
      return NextResponse.json({ error: 'English title is required' }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 检查 slug 唯一性
    const slugExists = await prisma.blogPost.findUnique({ where: { slug: slug.trim() } });
    if (slugExists) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // 验证分类存在
    if (categoryId) {
      const category = await prisma.blogCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
    }

    // 处理翻译数据
    const translations = [];
    if (zhTitle?.trim() || zhSlug?.trim() || zhContent?.trim()) {
      translations.push({
        locale: 'zh',
        title: zhTitle.trim() || title.trim(),
        slug: (zhSlug || slug).trim(),
        content: zhContent || '',
        excerpt: zhExcerpt || null,
        seoTitle: zhSeoTitle || null,
        seoDescription: zhSeoDescription || null,
        seoKeywords: zhSeoKeywords || null,
      });
    }

    const post = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        categoryId: categoryId || null,
        author: author || null,
        isPublished: Boolean(isPublished),
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        translations: {
          create: translations,
        },
      },
      include: {
        category: true,
        translations: true,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_BLOG_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
