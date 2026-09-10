import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, isValidLocale } from '@/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

// 生成静态参数 - 预渲染所有语言版本
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// 生成元数据
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isValidLocale(locale)) {
    return {};
  }
  
  const t = await getTranslations({ locale, namespace: 'home' });
  
  return {
    title: {
      default: 'TechTrade Pro - Premium Computer Peripherals',
      template: '%s | TechTrade Pro',
    },
    description: t('heroSubtitle'),
    keywords: ['mechanical keyboard', 'gaming mouse', 'computer accessories', 'wholesale', 'foreign trade'],
    authors: [{ name: 'TechTrade Pro' }],
    creator: 'TechTrade Pro',
    metadataBase: new URL('http://localhost:3000'),
    alternates: {
      canonical: '/',
      languages: {
        'en': '/en',
        'zh': '/zh',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: 'http://localhost:3000',
      siteName: 'TechTrade Pro',
      title: 'TechTrade Pro - Premium Computer Peripherals',
      description: t('heroSubtitle'),
    },
    twitter: {
      card: 'summary_large_image',
      title: 'TechTrade Pro',
      description: t('heroSubtitle'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // 验证语言
  if (!isValidLocale(locale)) {
    notFound();
  }

  // 设置当前请求语言（用于 next-intl server hooks）
  setRequestLocale(locale);

  // 获取语言消息
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <html lang={locale} suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
