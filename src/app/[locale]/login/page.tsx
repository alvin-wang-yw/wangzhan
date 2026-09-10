import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import LoginForm from '@/components/auth/LoginForm';

interface Props {
  params: { locale: string };
  searchParams?: { callbackUrl?: string; error?: string };
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: t('login'),
  };
}

export default async function LoginPage({ params: { locale }, searchParams }: Props) {
  setRequestLocale(locale);

  // 已登录用户跳转首页
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const callbackUrl = searchParams?.callbackUrl || `/${locale}`;
  const error = searchParams?.error;

  return (
    <div className="container flex items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="border rounded-lg shadow-sm bg-card">
          <div className="p-6 sm:p-8">
            <LoginForm callbackUrl={callbackUrl} error={error} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
