import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LayoutDashboard } from 'lucide-react';
import { auth } from '@/auth';
import DashboardClient from '@/components/admin/DashboardClient';

interface Props {
  params: { locale: string };
}

export default async function AdminDashboardPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const session = await auth();

  return (
    <div className="space-y-6">
      {/* 欢迎信息 */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('welcome')}, {session?.user?.name || 'Admin'} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboardSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Dashboard client component with real data */}
      <DashboardClient locale={locale} />
    </div>
  );
}
