import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/account/ProfileForm';

interface Props {
  params: { locale: string };
}

export default async function AccountProfilePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('account');
  const session = await auth();

  // 获取用户完整信息
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      country: true,
      avatar: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('accountDetails')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === 'zh'
            ? '查看和更新您的个人信息'
            : 'View and update your personal information'}
        </p>
      </div>

      <ProfileForm user={user} locale={locale} />
    </div>
  );
}
