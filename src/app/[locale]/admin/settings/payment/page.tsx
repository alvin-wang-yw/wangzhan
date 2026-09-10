import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import PaymentSettingsForm from '@/components/admin/settings/PaymentSettingsForm';
import { Globe, CreditCard, Truck, ChevronRight } from 'lucide-react';

interface Props {
  params: { locale: string };
}

export default async function PaymentSettingsPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('admin.settings');

  const subNavItems = [
    {
      href: `/${locale}/admin/settings/site`,
      label: t('siteSettings'),
      icon: Globe,
      active: false,
    },
    {
      href: `/${locale}/admin/settings/payment`,
      label: t('paymentSettings'),
      icon: CreditCard,
      active: true,
    },
    {
      href: `/${locale}/admin/settings/shipping`,
      label: t('shippingSettings'),
      icon: Truck,
      active: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('paymentSettings')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sub navigation */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="border rounded-lg bg-card p-2 space-y-0.5">
            {subNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.active && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <PaymentSettingsForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
