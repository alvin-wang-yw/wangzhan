import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { getOrCreateCart, calculateCartSummary } from '@/lib/cart';
import CartClient from '@/components/cart/CartClient';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'cart' });
  return {
    title: t('title'),
  };
}

/**
 * 购物车页面 - 服务端组件
 * 登录用户从数据库取数据，未登录返回空（前端读 localStorage）
 */
export default async function CartPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const session = await auth();
  const isLoggedIn = !!session?.user;

  let items: any[] = [];
  let summary = null;

  if (isLoggedIn && session?.user?.id) {
    const cart = await getOrCreateCart(session.user.id);
    items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        images: item.product.images.map((img) => ({
          url: img.url,
          altText: img.altText,
        })),
      },
    }));
    summary = calculateCartSummary(cart.items);
  }

  return (
    <CartClient
      isLoggedIn={isLoggedIn}
      initialItems={items}
      initialSummary={summary}
      locale={locale}
    />
  );
}
