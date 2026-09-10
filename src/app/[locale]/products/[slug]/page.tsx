import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductGallery from '@/components/products/ProductGallery';
import ProductCard from '@/components/products/ProductCard';
import ProductActions from '@/components/products/ProductActions';
import { formatPrice } from '@/lib/utils';
import { Package, Tag, Truck, Shield, Award } from 'lucide-react';

interface Props {
  params: { locale: string; slug: string };
}

export default async function ProductDetailPage({
  params: { locale, slug },
}: Props) {
  setRequestLocale(locale);
  const t = await getTranslations('product');

  // 按 slug 查找产品
  let product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, url: true, altText: true, isMain: true },
      },
      translations: {
        where: { locale },
        take: 1,
      },
      tagRelations: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  // 如果主表没找到，从翻译表查
  if (!product) {
    const translation = await prisma.productTranslation.findFirst({
      where: { slug, locale },
      select: { productId: true },
    });
    if (translation) {
      product = await prisma.product.findUnique({
        where: { id: translation.productId },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, url: true, altText: true, isMain: true },
          },
          translations: {
            where: { locale },
            take: 1,
          },
          tagRelations: {
            include: { tag: { select: { id: true, name: true, slug: true } } },
          },
        },
      });
    }
  }

  if (!product || product.status !== 'ACTIVE') {
    notFound();
  }

  const translation = product.translations[0];
  const displayName = translation?.name || product.name;
  const displaySlug = translation?.slug || product.slug;
  const displayDescription = translation?.description || product.description;
  const displayShortDesc = translation?.shortDesc || product.shortDesc;
  const seoTitle = translation?.seoTitle || product.seoTitle;
  const seoDescription = translation?.seoDescription || product.seoDescription;
  const seoKeywords = translation?.seoKeywords || product.seoKeywords;

  // 相关产品（同分类）
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: 'ACTIVE',
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        where: { isMain: true },
        take: 1,
        select: { url: true, altText: true },
      },
      translations: {
        where: { locale },
        take: 1,
        select: { name: true, slug: true },
      },
    },
  });

  const formattedRelated = relatedProducts.map((p) => {
    const tr = p.translations[0];
    const img = p.images[0];
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
  });

  const images = product.images.map((img) => ({
    id: img.id,
    url: img.url,
    altText: img.altText || '',
    isMain: img.isMain,
  }));

  const tags = product.tagRelations.map((tr) => tr.tag);
  const inStock = product.stock > 0;

  // 产品 JSON-LD 结构化数据
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    description: displayShortDesc || displayDescription?.slice(0, 200),
    image: images[0]?.url ? [images[0].url] : [],
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'TechTrade Pro',
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'USD',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `http://localhost:3000/${locale}/products/${displaySlug}`,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '0',
    },
    category: product.category?.name,
  };

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="container py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-muted-foreground mb-6">
        <a href={`/${locale}`} className="hover:text-primary transition-colors">
          Home
        </a>
        <span className="mx-2">/</span>
        <a href={`/${locale}/products`} className="hover:text-primary transition-colors">
          {t('title')}
        </a>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <a
              href={`/${locale}/products?category=${product.category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {product.category.name}
            </a>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{displayName}</span>
      </nav>

      {/* 主体信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        {/* 左侧：图片 */}
        <div>
          <ProductGallery images={images} productName={displayName} />
        </div>

        {/* 右侧：信息 */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {displayName}
            </h1>
            {displayShortDesc && (
              <p className="text-muted-foreground">{displayShortDesc}</p>
            )}
          </div>

          {/* SKU */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('sku')}: <span className="font-mono">{product.sku}</span></span>
            <span className="mx-1">|</span>
            <span>
              {t('category')}:{' '}
              <a
                href={`/${locale}/products?category=${product.category?.slug}`}
                className="text-primary hover:underline"
              >
                {product.category?.name}
              </a>
            </span>
          </div>

          {/* 价格 */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-bold text-foreground">
              {formatPrice(product.price.toString())}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.originalPrice.toString())}
              </span>
            )}
            {product.originalPrice && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-medium rounded">
                -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
              </span>
            )}
          </div>

          {/* 库存状态 */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                inStock
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  inStock ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {inStock ? t('inStock') : t('outOfStock')}
            </span>
            {inStock && product.stock < 50 && (
              <span className="text-sm text-amber-600">
                Only {product.stock} left in stock
              </span>
            )}
          </div>

          {/* 服务保障 */}
          <div className="grid grid-cols-3 gap-3 py-4 border-y">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">{t('freeShippingNotice')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Quality Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">12-Month Warranty</span>
            </div>
          </div>

          {/* 操作区域 */}
          <ProductActions
            productId={product.id}
            productName={displayName}
            price={product.price.toString()}
            stock={product.stock}
            minOrderQty={product.minOrderQty}
            inStock={inStock}
            locale={locale}
            productSlug={displaySlug}
            productImage={images[0]?.url}
          />

          {/* 标签 */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('tags')}:</span>
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground hover:bg-accent cursor-pointer transition-colors"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 描述 Tab */}
      <div className="mb-16">
        <div className="border-b mb-6">
          <div className="flex gap-6 -mb-px">
            <button className="px-1 py-3 text-sm font-medium border-b-2 border-primary text-primary">
              {t('description')}
            </button>
            <button className="px-1 py-3 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              {t('specifications')}
            </button>
            <button className="px-1 py-3 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground">
              {t('reviews')}
            </button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          {displayDescription ? (
            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
              {displayDescription}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('description')}</p>
          )}

          {/* 规格参数 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">SKU</p>
                <p className="font-medium">{product.sku}</p>
              </div>
            </div>
            {product.weight && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-medium">{product.weight} kg</p>
                </div>
              </div>
            )}
            {product.dimensions && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg md:col-span-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{product.dimensions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 相关产品 */}
      {formattedRelated.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">{t('relatedProducts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {formattedRelated.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={p.price}
                originalPrice={p.originalPrice}
                image={p.image}
                imageAlt={p.imageAlt}
                locale={locale}
                isNew={p.isNew}
                featured={p.featured}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  // 简单版 metadata，实际项目中可复用上面的查询逻辑
  const t = await getTranslations({ locale, namespace: 'product' });

  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        translations: { where: { locale }, take: 1 },
        images: { where: { isMain: true }, take: 1, select: { url: true } },
      },
    });

    if (!product) {
      const translation = await prisma.productTranslation.findFirst({
        where: { slug, locale },
        select: { productId: true },
      });
      if (translation) {
        product = await prisma.product.findUnique({
          where: { id: translation.productId },
          include: {
            translations: { where: { locale }, take: 1 },
            images: { where: { isMain: true }, take: 1, select: { url: true } },
          },
        });
      }
    }
  } catch {
    // ignore
  }

  const translation = product?.translations?.[0];
  const name = translation?.name || product?.name || t('title');
  const description = translation?.seoDescription || translation?.shortDesc || product?.description || '';
  const image = product?.images?.[0]?.url;

  return {
    title: translation?.seoTitle || product?.seoTitle || name,
    description,
    keywords: translation?.seoKeywords || product?.seoKeywords,
    openGraph: {
      title: name,
      description,
      images: image ? [image] : [],
      type: 'product',
    },
  };
}
