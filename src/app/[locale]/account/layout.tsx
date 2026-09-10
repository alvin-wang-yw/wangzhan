import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import AccountSidebar from '@/components/account/AccountSidebar';

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'account' });
  return {
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
  };
}

export default async function AccountLayout({ children, params: { locale } }: Props) {
  setRequestLocale(locale);

  // 校验登录状态
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/account`);
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* 侧边栏 */}
        <aside className="w-full md:w-56 shrink-0">
          <AccountSidebar locale={locale} user={session.user} />
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
