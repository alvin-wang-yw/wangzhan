'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  CreditCard,
  Landmark,
  Loader2,
  Package,
  ShoppingBag,
  AlertCircle,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getPaymentMethodLabel } from '@/lib/stripe';

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; altText: string | null }[];
  };
}

interface ShippingForm {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * 结算页客户端组件
 */
export default function CheckoutClient({
  isLoggedIn,
  locale,
}: {
  isLoggedIn: boolean;
  locale: string;
}) {
  const t = useTranslations('checkout');
  const commonT = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'en';

  const [items, setItems] = useState<CartItemData[]>([]);
  const [subtotal, setSubtotal] = useState('0.00');
  const [shippingFee, setShippingFee] = useState('0.00');
  const [total, setTotal] = useState('0.00');
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    country: 'United States',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 加载购物车数据
  useEffect(() => {
    loadCart();
  }, [isLoggedIn]);

  const loadCart = async () => {
    if (isLoggedIn) {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        if (res.ok && data.items.length > 0) {
          setItems(data.items);
          setSubtotal(data.summary.subtotal);
          setShippingFee(data.summary.shippingFee);
          setTotal(data.summary.total);
          setIsFreeShipping(data.summary.isFreeShipping);
        } else {
          router.push(`/${currentLocale}/cart`);
        }
      } catch {
        console.error('Failed to load cart');
      }
    } else {
      // 从 localStorage 读取
      try {
        const stored = localStorage.getItem('cart');
        if (stored) {
          const localItems = JSON.parse(stored);
          if (localItems.length > 0) {
            setItems(localItems);
            const sub = localItems.reduce(
              (sum: number, item: CartItemData) =>
                sum + parseFloat(item.unitPrice) * item.quantity,
              0
            );
            const ship = sub >= 99 ? 0 : 9.99;
            setSubtotal(sub.toFixed(2));
            setShippingFee(ship.toFixed(2));
            setTotal((sub + ship).toFixed(2));
            setIsFreeShipping(ship === 0);
          } else {
            router.push(`/${currentLocale}/cart`);
          }
        } else {
          router.push(`/${currentLocale}/cart`);
        }
      } catch {
        router.push(`/${currentLocale}/cart`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!shipping.firstName.trim()) newErrors.firstName = commonT('required');
    if (!shipping.lastName.trim()) newErrors.lastName = commonT('required');
    if (!shipping.email.trim()) {
      newErrors.email = commonT('required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      newErrors.email = commonT('invalidEmail');
    }
    if (!shipping.phone.trim()) newErrors.phone = commonT('required');
    if (!shipping.country.trim()) newErrors.country = commonT('required');
    if (!shipping.addressLine1.trim()) newErrors.addressLine1 = commonT('required');
    if (!shipping.city.trim()) newErrors.city = commonT('required');
    if (!shipping.postalCode.trim()) newErrors.postalCode = commonT('required');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    setError('');

    if (!validate()) return;
    if (items.length === 0) return;

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        shipping,
        paymentMethod,
      };

      // 未登录用户传递本地购物车数据
      if (!isLoggedIn) {
        body.localItems = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
        }));
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        // 清空本地购物车
        if (!isLoggedIn) {
          localStorage.removeItem('cart');
          window.dispatchEvent(new Event('cart-updated'));
        }

        // 模拟支付（直接支付成功）
        try {
          await fetch(`/api/orders/${data.orderId}/pay`, { method: 'POST' });
        } catch {
          // 支付模拟失败不影响订单创建
        }

        // 跳转到订单成功页
        router.push(
          `/${currentLocale}/order-success?orderNo=${encodeURIComponent(data.orderNo)}`
        );
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError(locale === 'zh' ? '提交订单失败，请重试' : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">{commonT('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>

      {/* 未登录提示 */}
      {!isLoggedIn && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {locale === 'zh'
                ? '您正在以游客身份结算'
                : "You're checking out as a guest"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === 'zh'
                ? '登录后可查看订单历史、保存收货地址'
                : 'Login to track orders and save shipping addresses'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${currentLocale}/login?callbackUrl=/${currentLocale}/checkout`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              {locale === 'zh' ? '登录' : 'Login'}
            </Link>
            <Link
              href={`/${currentLocale}/register`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-accent transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              {locale === 'zh' ? '注册' : 'Register'}
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左侧：收货信息表单 */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* 收货地址 */}
          <div className="border rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">{t('billingDetails')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('firstName')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="firstName"
                  value={shipping.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.firstName ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('lastName')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="lastName"
                  value={shipping.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.lastName ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  {t('company')}
                </label>
                <input
                  name="company"
                  value={shipping.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('email')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={shipping.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.email ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('phone')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="phone"
                  value={shipping.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.phone ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  {t('country')} <span className="text-destructive">*</span>
                </label>
                <select
                  name="country"
                  value={shipping.country}
                  onChange={handleInputChange as any}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.country ? 'border-destructive' : 'border-input'
                  }`}
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="China">China</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other</option>
                </select>
                {errors.country && (
                  <p className="mt-1 text-xs text-destructive">{errors.country}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  {t('address')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="addressLine1"
                  value={shipping.addressLine1}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.addressLine1 ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.addressLine1 && (
                  <p className="mt-1 text-xs text-destructive">{errors.addressLine1}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  {t('apartment')}
                </label>
                <input
                  name="addressLine2"
                  value={shipping.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('city')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="city"
                  value={shipping.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.city ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-destructive">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('state')}
                </label>
                <input
                  name="state"
                  value={shipping.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('postalCode')} <span className="text-destructive">*</span>
                </label>
                <input
                  name="postalCode"
                  value={shipping.postalCode}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.postalCode ? 'border-destructive' : 'border-input'
                  }`}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-destructive">{errors.postalCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* 支付方式 */}
          <div className="border rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">{t('paymentMethod')}</h2>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'stripe'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  className="w-4 h-4 text-primary focus:ring-primary/50"
                />
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {getPaymentMethodLabel('stripe', locale)}
                </span>
              </label>

              <label
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'paypal'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="w-4 h-4 text-primary focus:ring-primary/50"
                />
                <div className="h-5 w-5 rounded bg-[#003087] flex items-center justify-center text-white text-xs font-bold">
                  P
                </div>
                <span className="font-medium">
                  {getPaymentMethodLabel('paypal', locale)}
                </span>
              </label>

              <label
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="w-4 h-4 text-primary focus:ring-primary/50"
                />
                <Landmark className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {getPaymentMethodLabel('bank_transfer', locale)}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 右侧：订单摘要 */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="border rounded-lg bg-card p-5 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">{t('orderSummary')}</h2>

            {/* 商品列表 */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
              {items.map((item) => {
                const image = item.product.images?.[0];
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 rounded-md border bg-muted shrink-0 overflow-hidden relative">
                      {image?.url ? (
                        <img
                          src={image.url}
                          alt={image.altText || item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-muted-foreground text-background text-xs flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 金额明细 */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span className="font-medium">
                  {isFreeShipping ? (
                    <span className="text-green-600">
                      {locale === 'zh' ? '免运费' : 'Free Shipping'}
                    </span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax')}</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">{t('total')}</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* 提交订单按钮 */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full mt-5 py-3 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {t('placeOrder')}
            </button>

            <Link
              href={`/${currentLocale}/cart`}
              className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-primary text-center block transition-colors"
            >
              ← {locale === 'zh' ? '返回购物车' : 'Back to cart'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
