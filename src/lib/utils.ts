import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名，自动处理冲突
 * 使用 clsx 条件组合 + tailwind-merge 去重合并
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化价格显示
 */
export function formatPrice(
  price: number | string,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
  } = {}
) {
  const { currency = 'USD', locale = 'en-US', minimumFractionDigits = 2 } = options;
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(numericPrice);
}

/**
 * 生成唯一订单号
 * 格式: FT + 年月日时分秒 + 4位随机数
 */
export function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FT${dateStr}${random}`;
}

/**
 * 截断文本到指定长度
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * 将字符串转换为 URL 友好的 slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * 生成随机 ID（临时使用，实际用 cuid/数据库生成）
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * 从 URL 获取参数值
 */
export function getSearchParam(param: string, searchParams?: { [key: string]: string | string[] | undefined }): string | undefined {
  if (!searchParams) return undefined;
  const value = searchParams[param];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * 计算购物车商品总数
 */
export function calculateCartItemCount(items: { quantity: number }[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * 计算购物车总价
 */
export function calculateCartTotal(items: { quantity: number; unitPrice: number | string }[]): number {
  return items.reduce((total, item) => {
    const price = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
    return total + price * item.quantity;
  }, 0);
}
