import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

interface Props {
  params: { locale: string };
}

export default async function TermsPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('terms');

  const sections = [
    'acceptance',
    'userAccount',
    'productInformation',
    'pricingPayment',
    'shippingDelivery',
    'returnsRefunds',
    'intellectualProperty',
    'userConduct',
    'disclaimer',
    'limitation',
    'governingLaw',
    'changes',
    'contact',
  ];

  return (
    <div className="container py-12 max-w-4xl">
      <Link
        href={`/${locale}/about`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToAbout')}
      </Link>

      <div className="text-center mb-10">
        <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('lastUpdated')}</p>
      </div>

      <div className="bg-card border rounded-lg p-8 prose prose-sm max-w-none">
        <p className="text-muted-foreground mb-8">{t('intro')}</p>

        {sections.map((section, index) => (
          <section key={section} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-foreground">
              {index + 1}. {t(`${section}.title`)}
            </h2>
            <div className="text-muted-foreground space-y-3 leading-relaxed">
              {[1, 2, 3].map((n) => {
                const key = `${section}.p${n}`;
                try {
                  const text = t(key);
                  if (text === key) return null;
                  return <p key={n}>{text}</p>;
                } catch {
                  return null;
                }
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'terms' });
  return {
    title: t('title'),
    description: t('intro'),
  };
}
