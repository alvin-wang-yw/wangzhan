import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
  };
}

export default async function AdminLayout({ children, params: { locale } }: Props) {
  setRequestLocale(locale);

  // 校验登录状态
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }

  // 校验管理员角色
  if (session.user.role !== 'ADMIN') {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        {/* 侧边栏 */}
        <AdminSidebar locale={locale} />

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader locale={locale} user={session.user} />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
