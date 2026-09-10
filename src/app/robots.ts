import { MetadataRoute } from 'next';
import { locales } from '@/i18n';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * 动态生成 robots.txt
 * 允许爬取前台页面，禁止爬取后台、购物车、结算、用户中心等
 */
export default function robots(): MetadataRoute.Robots {
  // 需要禁止的路径模式
  const disallowPaths: string[] = [];

  for (const locale of locales) {
    disallowPaths.push(`/${locale}/admin`);
    disallowPaths.push(`/${locale}/cart`);
    disallowPaths.push(`/${locale}/checkout`);
    disallowPaths.push(`/${locale}/account`);
    disallowPaths.push(`/${locale}/order-success`);
    disallowPaths.push(`/${locale}/login`);
    disallowPaths.push(`/${locale}/register`);
    disallowPaths.push(`/${locale}/api/`);
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallowPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
