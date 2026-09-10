import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import {
  Truck,
  ShieldCheck,
  Lock,
  Headphones,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface Props {
  params: { locale: string };
}

export default async function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('home');

  // 从数据库获取 Banner
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    take: 5,
  });

  // 获取分类
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    take: 8,
    include: {
      _count: { select: { products: true } },
      children: { take: 5, orderBy: { sortOrder: 'asc' } },
    },
  });

  // 推荐产品
  const featuredProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE', featured: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      images: { where: { isMain: true }, take: 1, select: { url: true, altText: true } },
      translations: { where: { locale }, take: 1, select: { name: true, slug: true } },
    },
  });

  // 最新产品
  const newProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      images: { where: { isMain: true }, take: 1, select: { url: true, altText: true } },
      translations: { where: { locale }, take: 1, select: { name: true, slug: true } },
    },
  });

  // 格式化产品
  const formatProduct = (p: any) => {
    const tr = p.translations?.[0];
    const img = p.images?.[0];
    return {
      id: p.id,
      name: tr?.name || p.name,
      slug: tr?.slug || p.slug,
      price: p.price.toString(),
      originalPrice: p.originalPrice?.toString() || null,
      image: img?.url || '',
      imageAlt: img?.altText || '',
      isNew: p.isNew,
      featured: p.featured,
    };
  };

  const featuredFormatted = featuredProducts.map(formatProduct);
  const newFormatted = newProducts.map(formatProduct);

  // 主要 Banner（第一张）
  const mainBanner = banners[0];

  const features = [
    { icon: Truck, title: t('freeShipping'), desc: t('freeShippingDesc') },
    { icon: ShieldCheck, title: t('qualityGuarantee'), desc: t('qualityGuaranteeDesc') },
    { icon: Lock, title: t('securePayment'), desc: t('securePaymentDesc') },
    { icon: Headphones, title: t('247Support'), desc: t('247SupportDesc') },
  ];

  return (
    <div>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'TechTrade Pro',
            url: 'http://localhost:3000',
            logo: '',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+86-755-12345678',
              contactType: 'customer service',
              email: 'support@techtradepro.com',
              areaServed: 'Worldwide',
              availableLanguage: ['English', 'Chinese'],
            },
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Nanshan District',
              addressLocality: 'Shenzhen',
              addressRegion: 'Guangdong',
              postalCode: '518000',
              addressCountry: 'CN',
            },
            sameAs: [
              'https://facebook.com',
              'https://twitter.com',
              'https://instagram.com',
              'https://linkedin.com',
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'TechTrade Pro',
            url: 'http://localhost:3000',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'http://localhost:3000/{locale}/products?keyword={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
            inLanguage: ['en', 'zh'],
          }),
        }}
      />

      {/* Hero Banner */}
      {mainBanner ? (
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          {mainBanner.imageUrl && (
            <img
              src={mainBanner.imageUrl}
              alt={mainBanner.title}
              className="absolute inset-0 w-full h-full object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
          <div className="container relative h-full flex items-center">
            <div className="max-w-xl text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                {mainBanner.title}
              </h1>
              {mainBanner.subtitle && (
                <p className="text-lg md:text-xl text-white/80 mb-8">
                  {mainBanner.subtitle}
                </p>
              )}
              <div className="flex gap-4">
                <Link
                  href={mainBanner.linkUrl || `/${locale}/products`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  {mainBanner.buttonText || t('shopNow')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="text-center py-20 bg-muted/30">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('heroSubtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/${locale}/products`}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              {t('shopNow')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* 服务特色 */}
      <section className="py-12 bg-card border-y">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 分类快捷入口 */}
      {categories.length > 0 && (
        <section className="py-16 container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('bestsellers')}
              </h2>
              <p className="text-muted-foreground mt-2">
                Explore our top product categories
              </p>
            </div>
            <Link
              href={`/${locale}/products`}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {t('viewAllProducts')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/products?category=${cat.slug}`}
                className="group bg-card border rounded-xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {cat._count.products} products
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 推荐产品 */}
      {featuredFormatted.length > 0 && (
        <section className="py-16 bg-muted/20">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t('featuredProducts')}
                </h2>
                <p className="text-muted-foreground mt-2">
                  Hand-picked bestsellers for you
                </p>
              </div>
              <Link
                href={`/${locale}/products`}
                className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {t('viewAllProducts')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredFormatted.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.image}
                  imageAlt={product.imageAlt}
                  locale={locale}
                  isNew={product.isNew}
                  featured={product.featured}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 最新产品 */}
      {newFormatted.length > 0 && (
        <section className="py-16 container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t('newArrivals')}
              </h2>
              <p className="text-muted-foreground mt-2">
                Check out our latest additions
              </p>
            </div>
            <Link
              href={`/${locale}/products?sort=newest`}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {t('viewAllProducts')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {newFormatted.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.image}
                imageAlt={product.imageAlt}
                locale={locale}
                isNew={product.isNew}
                featured={product.featured}
              />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {t('newsletterTitle')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('newsletterDesc')}
          </p>
          <form className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder={t('newsletterPlaceholder')}
              className="flex-1 px-4 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              {t('newsletterSubscribe')}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
