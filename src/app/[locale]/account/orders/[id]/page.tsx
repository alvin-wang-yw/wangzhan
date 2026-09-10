import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import UserOrderDetailClient from '@/components/account/UserOrderDetailClient';

export async function generateMetadata({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const t = await getTranslations({ locale, namespace: 'order' });
  return {
    title: t('orderDetails'),
  };
}

/**
 * 用户订单详情页
 */
export default function AccountOrderDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);

  return <UserOrderDetailClient orderId={id} locale={locale} />;
}
