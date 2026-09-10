/**
 * Stripe 支付配置
 * 
 * 接入真实 Stripe 步骤：
 * 1. 在 .env 中配置 STRIPE_SECRET_KEY 和 STRIPE_PUBLISHABLE_KEY
 * 2. 安装 stripe 包: npm install stripe
 * 3. 取消下方注释启用 Stripe SDK
 * 4. 在结算页集成 Stripe Elements 进行支付
 * 5. 配置 Webhook 处理支付结果回调
 */

// 如需启用真实 Stripe，请先安装: npm install stripe @stripe/react-stripe-js @stripe/stripe-js
// import Stripe from 'stripe';

// const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// export const stripe = stripeSecretKey
//   ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
//   : null;

/**
 * 环境变量说明：
 * 
 * STRIPE_SECRET_KEY=sk_test_xxx          # Stripe 服务端密钥
 * STRIPE_PUBLISHABLE_KEY=pk_test_xxx     # Stripe 前端公钥
 * STRIPE_WEBHOOK_SECRET=whsec_xxx        # Stripe Webhook 签名密钥（可选）
 */

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  isEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
  currency: 'usd',
};

/**
 * 支持的支付方式
 */
export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

/**
 * 获取支付方式显示名称
 */
export function getPaymentMethodLabel(method: string, locale = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    stripe: { en: 'Credit / Debit Card (Stripe)', zh: '信用卡/借记卡 (Stripe)' },
    paypal: { en: 'PayPal', zh: 'PayPal' },
    bank_transfer: { en: 'Bank Transfer', zh: '银行转账' },
  };
  return labels[method]?.[locale] || method;
}
