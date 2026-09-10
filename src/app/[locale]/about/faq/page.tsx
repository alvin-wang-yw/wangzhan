import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, MessageCircle } from 'lucide-react';

interface Props {
  params: { locale: string };
}

export default async function FAQPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('faq');

  const categories = [
    {
      key: 'ordering',
      questions: ['q1', 'q2', 'q3'],
    },
    {
      key: 'shipping',
      questions: ['q1', 'q2', 'q3'],
    },
    {
      key: 'payment',
      questions: ['q1', 'q2', 'q3'],
    },
    {
      key: 'returns',
      questions: ['q1', 'q2', 'q3'],
    },
    {
      key: 'products',
      questions: ['q1', 'q2', 'q3'],
    },
    {
      key: 'account',
      questions: ['q1', 'q2'],
    },
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

      <div className="text-center mb-12">
        <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="space-y-10">
        {categories.map((cat) => (
          <section key={cat.key}>
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
              {t(`${cat.key}.title`)}
            </h2>
            <div className="space-y-4">
              {cat.questions.map((q) => (
                <div
                  key={q}
                  className="bg-card border rounded-lg p-5 hover:shadow-sm transition-shadow"
                >
                  <h3 className="font-medium mb-2 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm inline-flex items-center justify-center flex-shrink-0 mt-0.5">
                      ?
                    </span>
                    {t(`${cat.key}.${q}.question`)}
                  </h3>
                  <p className="text-muted-foreground text-sm ml-9 leading-relaxed">
                    {t(`${cat.key}.${q}.answer`)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 还有问题 */}
      <div className="mt-16 text-center bg-card border rounded-xl p-10">
        <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('stillHaveQuestions')}</h2>
        <p className="text-muted-foreground mb-6">{t('stillHaveQuestionsDesc')}</p>
        <Link
          href={`/${locale}/contact`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          {t('contactUs')}
        </Link>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'faq' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}
