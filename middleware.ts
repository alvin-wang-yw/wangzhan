import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n';

export default createMiddleware({
  // 支持的语言列表
  locales,
  
  // 默认语言（访问不带语言前缀的路径时重定向）
  defaultLocale,
  
  // 默认语言是否显示前缀（false 时 / 路径显示英文，不重定向）
  localePrefix: 'as-needed',
  
  // 自动检测用户浏览器语言
  localeDetection: true,
});

export const config = {
  // 匹配所有路径，排除以下路径：
  // - api 路由
  // - _next 静态资源
  // - 公共静态资源 (favicon, images 等)
  // - 图片资源
  matcher: [
    // 启用对所有路径的国际化，除了:
    '/',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
