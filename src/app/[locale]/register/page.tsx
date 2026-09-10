import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import RegisterForm from '@/components/auth/RegisterForm';

interface Props {
  params: { locale: string };
  searchParams?: { callbackUrl?: string };
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: t('register'),
  };
}

export default async function RegisterPage({ params: { locale }, searchParams }: Props) {
  setRequestLocale(locale);

  // 已登录用户跳转首页
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const callbackUrl = searchParams?.callbackUrl || `/${locale}`;

  return (
    <div className="container flex items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="border rounded-lg shadow-sm bg-card">
          <div className="p-6 sm:p-8">
            <RegisterForm callbackUrl={callbackUrl} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
