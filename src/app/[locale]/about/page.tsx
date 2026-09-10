import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import {
  Award,
  Shield,
  Zap,
  Users,
  Globe,
  Target,
  Heart,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Package,
  ThumbsUp,
} from 'lucide-react';

interface Props {
  params: { locale: string };
}

export default async function AboutPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('about');

  const values = [
    { icon: Shield, titleKey: 'quality', descKey: 'qualityDesc' },
    { icon: Zap, titleKey: 'innovation', descKey: 'innovationDesc' },
    { icon: Heart, titleKey: 'customerFirst', descKey: 'customerFirstDesc' },
    { icon: Globe, titleKey: 'globalVision', descKey: 'globalVisionDesc' },
  ];

  const whyChooseUs = [
    { icon: Award, titleKey: 'premiumQuality', descKey: 'premiumQualityDesc' },
    { icon: TrendingUp, titleKey: 'competitivePricing', descKey: 'competitivePricingDesc' },
    { icon: Package, titleKey: 'fastDelivery', descKey: 'fastDeliveryDesc' },
    { icon: ThumbsUp, titleKey: 'expertSupport', descKey: 'expertSupportDesc' },
  ];

  const stats = [
    { number: '10+', labelKey: 'yearsExperience' },
    { number: '50+', labelKey: 'countriesServed' },
    { number: '1000+', labelKey: 'products' },
    { number: '10000+', labelKey: 'happyCustomers' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-12 -mt-8">
        <div className="bg-card border rounded-xl shadow-sm p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.number}
              </p>
              <p className="text-sm text-muted-foreground">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">{t('ourStory')}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('storyParagraph1')}</p>
              <p>{t('storyParagraph2')}</p>
              <p>{t('storyParagraph3')}</p>
            </div>
          </div>
          <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center">
            <Users className="h-32 w-32 text-primary/20" />
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('ourMission')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('missionDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <Target className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('missionTitle1')}</h3>
              <p className="text-muted-foreground">{t('missionText1')}</p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <Lightbulb className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('missionTitle2')}</h3>
              <p className="text-muted-foreground">{t('missionText2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('ourValues')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <div key={i} className="bg-card border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t(value.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(value.descKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('whyChooseUs')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t(item.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          {t('readyToWork')}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          {t('readyToWorkDesc')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/${locale}/contact`}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            {t('contactUs')}
          </Link>
          <Link
            href={`/${locale}/products`}
            className="px-6 py-3 border rounded-md font-medium hover:bg-muted transition-colors"
          >
            {t('browseProducts')}
          </Link>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      type: 'website',
    },
  };
}
