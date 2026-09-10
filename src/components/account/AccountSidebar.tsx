'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import {
  User,
  ShoppingBag,
  MapPin,
  Lock,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountSidebarProps {
  locale: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function AccountSidebar({ locale, user }: AccountSidebarProps) {
  const t = useTranslations('account');
  const navT = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      href: `/${locale}/account`,
      label: t('accountDetails'),
      icon: User,
      exact: true,
    },
    {
      href: `/${locale}/account/orders`,
      label: t('orders'),
      icon: ShoppingBag,
    },
    {
      href: `/${locale}/account/addresses`,
      label: t('addresses'),
      icon: MapPin,
    },
    {
      href: `/${locale}/account/password`,
      label: t('changePassword'),
      icon: Lock,
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* 用户信息卡片 */}
      <div className="border rounded-lg bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
        {user.role === 'ADMIN' && (
          <Link
            href={`/${locale}/admin`}
            className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <Shield className="h-3.5 w-3.5" />
            {locale === 'zh' ? '进入管理后台' : 'Go to Admin Panel'}
          </Link>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="border rounded-lg bg-card p-2 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors border border-destructive/20 bg-card"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        <span>{navT('logout')}</span>
      </button>
    </div>
  );
}
