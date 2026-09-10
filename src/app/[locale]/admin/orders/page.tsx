import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import AdminOrdersClient from '@/components/admin/AdminOrdersClient';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('sidebar.orders'),
  };
}

/**
 * 管理员订单列表页
 */
export default function AdminOrdersPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return <AdminOrdersClient locale={locale} />;
}
