import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { locales } from '@/i18n';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * 动态生成 sitemap.xml
 * 包含：首页、分类页、产品详情页、博客列表、博客文章、静态页面
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  try {
    // 静态页面
    const staticPages = [
      '', // 首页
      '/products',
      '/blog',
      '/about',
      '/contact',
      '/about/privacy',
      '/about/terms',
      '/about/faq',
      '/login',
      '/register',
    ];

    // 每种语言
    for (const locale of locales) {
      // 静态页面
      for (const page of staticPages) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}${page}`,
          lastModified: new Date(),
          changeFrequency: page === '' ? 'daily' : 'weekly',
          priority: page === '' ? 1 : 0.8,
        });
      }
    }

    // 产品分类页
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      });

      for (const locale of locales) {
        for (const cat of categories) {
          sitemapEntries.push({
            url: `${baseUrl}/${locale}/products?category=${cat.slug}`,
            lastModified: cat.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    } catch {
      // ignore
    }

    // 产品详情页
    try {
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          slug: true,
          updatedAt: true,
          translations: {
            where: { locale: 'zh' },
            select: { slug: true },
            take: 1,
          },
        },
      });

      for (const product of products) {
        // 英文版
        sitemapEntries.push({
          url: `${baseUrl}/en/products/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });

        // 中文版
        const zhSlug = product.translations[0]?.slug || product.slug;
        sitemapEntries.push({
          url: `${baseUrl}/zh/products/${zhSlug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    } catch {
      // ignore
    }

    // 博客文章
    try {
      const posts = await prisma.blogPost.findMany({
        where: { isPublished: true },
        select: {
          slug: true,
          updatedAt: true,
          translations: {
            where: { locale: 'zh' },
            select: { slug: true },
            take: 1,
          },
        },
      });

      for (const post of posts) {
        // 英文版
        sitemapEntries.push({
          url: `${baseUrl}/en/blog/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.6,
        });

        // 中文版
        const zhSlug = post.translations[0]?.slug || post.slug;
        sitemapEntries.push({
          url: `${baseUrl}/zh/blog/${zhSlug}`,
          lastModified: post.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    } catch {
      // ignore
    }
  } catch (error) {
    console.error('[SITEMAP] Error generating sitemap:', error);
  }

  return sitemapEntries;
}
