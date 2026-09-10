import { getTranslations, setRequestLocale } from 'next-intl/server';
import ChangePasswordForm from '@/components/account/ChangePasswordForm';

interface Props {
  params: { locale: string };
}

export default async function AccountPasswordPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('account');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('changePassword')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === 'zh'
            ? '修改您的账户登录密码'
            : 'Update your account password'}
        </p>
      </div>

      <ChangePasswordForm locale={locale} />
    </div>
  );
}
