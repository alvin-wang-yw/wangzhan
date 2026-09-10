import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// 支持的语言列表
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'en';

// 检查是否为有效语言
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default getRequestConfig(async ({ locale }) => {
  // 验证语言是否有效
  if (!isValidLocale(locale)) {
    notFound();
  }

  return {
    // 加载对应语言的消息文件
    messages: (await import(`./messages/${locale}.json`)).default,
    
    // 时区配置
    timeZone: 'Asia/Shanghai',
    
    // 日期时间格式配置
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      },
    },
  };
});
