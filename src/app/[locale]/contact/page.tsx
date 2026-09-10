import { getTranslations, setRequestLocale } from 'next-intl/server';
import ContactForm from '@/components/contact/ContactForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ContactPage({ params: { locale }, searchParams }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  const productId = (searchParams.productId as string) || '';
  const productName = (searchParams.productName as string) || '';

  return (
    <div className="container py-12">
      {/* 页面头部 */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          {t('title')}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 左侧表单 */}
        <div className="lg:col-span-3">
          <ContactForm
            locale={locale}
            defaultProductId={productId}
            defaultProductName={productName}
          />
        </div>

        {/* 右侧联系信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 联系方式卡片 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-5">{t('contactInfo')}</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('emailUs')}</p>
                  <p className="text-sm text-muted-foreground">support@techtradepro.com</p>
                  <p className="text-sm text-muted-foreground">sales@techtradepro.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('callUs')}</p>
                  <p className="text-sm text-muted-foreground">+86 755-12345678</p>
                  <p className="text-sm text-muted-foreground">+86 138-0000-0000</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('visitUs')}</p>
                  <p className="text-sm text-muted-foreground">
                    Tech Trade Pro Building<br />
                    Nanshan District, Shenzhen<br />
                    Guangdong, China 518000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t('businessHours')}</p>
                  <p className="text-sm text-muted-foreground">{t('businessHoursValue')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 地图占位 */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
              <MapPin className="h-16 w-16 text-muted-foreground/30" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-background/90 backdrop-blur-sm rounded-md p-3">
                  <p className="text-sm font-medium">Shenzhen Headquarters</p>
                  <p className="text-xs text-muted-foreground">Nanshan District, Shenzhen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'contact' });
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
