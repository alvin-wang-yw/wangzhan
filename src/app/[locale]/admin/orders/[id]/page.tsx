import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import AdminOrderDetailClient from '@/components/admin/AdminOrderDetailClient';

export async function generateMetadata({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const t = await getTranslations({ locale, namespace: 'order' });
  return {
    title: `${t('orderDetails')} - ${id.slice(0, 8)}...`,
  };
}

/**
 * 管理员订单详情页
 */
export default function AdminOrderDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);

  return <AdminOrderDetailClient orderId={id} locale={locale} />;
}
