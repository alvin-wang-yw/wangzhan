import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import UserOrdersClient from '@/components/account/UserOrdersClient';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'account' });
  return {
    title: t('orders'),
  };
}

/**
 * 用户订单列表页
 */
export default function AccountOrdersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return <UserOrdersClient locale={locale} />;
}
