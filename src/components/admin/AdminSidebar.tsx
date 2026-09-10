'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  locale: string;
}

export default function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = useTranslations('admin.sidebar');
  const pathname = usePathname();

  const menuItems = [
    { href: `/${locale}/admin`, label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: `/${locale}/admin/products`, label: t('products'), icon: Package },
    { href: `/${locale}/admin/categories`, label: t('categories'), icon: Layers },
    { href: `/${locale}/admin/orders`, label: t('orders'), icon: ShoppingCart },
    { href: `/${locale}/admin/users`, label: t('users'), icon: Users },
    { href: `/${locale}/admin/blog`, label: t('blog'), icon: FileText },
    { href: `/${locale}/admin/inquiries`, label: t('inquiries'), icon: MessageSquare },
    { href: `/${locale}/admin/settings/site`, label: t('settings'), icon: Settings },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col shrink-0">
      {/* Logo 区域 */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-foreground">Admin</span>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部返回前台 */}
      <div className="p-3 border-t">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Store className="h-5 w-5 flex-shrink-0" />
          <span>{t('backToStore')}</span>
        </Link>
      </div>
    </aside>
  );
}
