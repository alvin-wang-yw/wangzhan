import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import OrderSuccessClient from '@/components/checkout/OrderSuccessClient';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return {
    title: t('orderSuccess'),
  };
}

/**
 * 订单成功页面
 */
export default function OrderSuccessPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <Suspense fallback={<div className="container py-16 text-center text-muted-foreground">Loading...</div>}>
      <OrderSuccessClient locale={locale} />
    </Suspense>
  );
}
