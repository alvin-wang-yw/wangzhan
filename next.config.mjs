import createNextIntlPlugin from 'next-intl/plugin';

// next-intl 插件配置
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片域名白名单
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // React 严格模式
  reactStrictMode: true,
  // 实验性功能
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default withNextIntl(nextConfig);
