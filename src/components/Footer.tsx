'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

/**
 * 页脚组件
 * 包含：Logo/简介、快速链接、客户服务、联系方式、邮件订阅、版权信息
 */
export default function Footer() {
  const t = useTranslations('footer');
  const commonT = useTranslations('common');
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1] || 'en';

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: t('about'), href: '/about' },
    { label: t('contactUs'), href: '/contact' },
    { label: t('blog'), href: '/blog' },
    { label: t('faq'), href: '/about/faq' },
  ];

  const customerServiceLinks = [
    { label: t('shippingPolicy'), href: '/shipping-policy' },
    { label: t('returnPolicy'), href: '/return-policy' },
    { label: t('warrantyPolicy'), href: '/warranty-policy' },
    { label: t('trackOrder'), href: '/track-order' },
    { label: t('myAccount'), href: '/account' },
  ];

  const legalLinks = [
    { label: t('privacyPolicy'), href: '/about/privacy' },
    { label: t('termsOfService'), href: '/about/terms' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com', label: 'Youtube' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <footer className="border-t bg-muted/30">
      {/* 主内容区 */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo + 简介 + 联系方式 */}
          <div className="lg:col-span-1">
            <Link href={`/${currentLocale}`} className="text-xl font-bold text-primary">
              TechTrade Pro
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Premium computer peripherals and accessories for professionals and gamers worldwide.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@techtradepro.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+86 755-12345678</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Shenzhen, Guangdong, China</span>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${currentLocale}${link.href}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 客户服务 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('customerService')}</h3>
            <ul className="space-y-3">
              {customerServiceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${currentLocale}${link.href}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 邮件订阅 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">{t('newsletter')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('newsletterDesc')}</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={t('newsletterPlaceholder')}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {t('subscribe')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 底部版权 + 社交 + 支付 */}
      <div className="border-t">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 版权 */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} TechTrade Pro. All rights reserved.
          </p>

          {/* 支付方式 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">{t('paymentMethods')}:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">VISA</span>
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">MC</span>
              <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded">PP</span>
              <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">Stripe</span>
            </div>
          </div>

          {/* 社交链接 */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
