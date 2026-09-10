import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return {
    title: t('title'),
  };
}

/**
 * 结算页面 - 服务端组件
 */
export default async function CheckoutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const session = await auth();
  const isLoggedIn = !!session?.user;

  return <CheckoutClient isLoggedIn={isLoggedIn} locale={locale} />;
}
