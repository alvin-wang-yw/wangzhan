import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: { id: string };
}

/**
 * 获取博客文章详情（用于编辑）
 */
export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        translations: {
          select: {
            locale: true,
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
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[ADMIN_BLOG_GET_ID]', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

/**
 * 更新博客文章
 */
export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // 检查文章是否存在
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      categoryId,
      author,
      isPublished,
      seoTitle,
      seoDescription,
      seoKeywords,
      zhTitle,
      zhSlug,
      zhContent,
      zhExcerpt,
      zhSeoTitle,
      zhSeoDescription,
      zhSeoKeywords,
      tags,
    } = body;

    // 验证必填项
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 });
    }

    // 检查 slug 唯一性
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    // 构建主数据
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (author !== undefined) updateData.author = author || null;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords || null;

    // 处理中文翻译
    if (zhTitle !== undefined || zhContent !== undefined || zhExcerpt !== undefined) {
      const zhTranslation = await prisma.blogPostTranslation.findUnique({
        where: { postId_locale: { postId: id, locale: 'zh' } },
      });

      const zhData = {
        title: zhTitle?.trim() || existing.title,
        slug: (zhSlug || slug || existing.slug).trim(),
        content: zhContent || '',
        excerpt: zhExcerpt || null,
        seoTitle: zhSeoTitle || null,
        seoDescription: zhSeoDescription || null,
        seoKeywords: zhSeoKeywords || null,
      };

      if (zhTranslation) {
        await prisma.blogPostTranslation.update({
          where: { postId_locale: { postId: id, locale: 'zh' } },
          data: zhData,
        });
      } else if (zhTitle?.trim() || zhContent?.trim() || zhExcerpt) {
        await prisma.blogPostTranslation.create({
          data: { ...zhData, postId: id, locale: 'zh' },
        });
      }
    }

    // 处理标签（全量替换）
    if (tags !== undefined && Array.isArray(tags)) {
      await prisma.blogPostTagRelation.deleteMany({ where: { postId: id } });
      for (const tagId of tags) {
        const tag = await prisma.blogTag.findUnique({ where: { id: tagId } });
        if (tag) {
          await prisma.blogPostTagRelation.create({
            data: { postId: id, tagId },
          });
        }
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        translations: true,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[ADMIN_BLOG_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

/**
 * 删除博客文章
 */
export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN_BLOG_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
