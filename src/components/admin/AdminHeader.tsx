'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  locale: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function AdminHeader({ locale, user }: AdminHeaderProps) {
  const t = useTranslations('admin.header');
  const commonT = useTranslations('common');
  const navT = useTranslations('nav');
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-4">
        {/* 前台链接 */}
        <Link
          href={`/${locale}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('viewStore')}
        </Link>

        {/* 用户菜单 */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user.name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('adminLabel')}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              {/* 点击外部关闭 */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-md z-50 py-1">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name || 'Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                <Link
                  href={`/${locale}/admin/settings`}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full'
                  )}
                >
                  <Settings className="h-4 w-4" />
                  {commonT('save') || t('settings')}
                </Link>

                <Link
                  href={`/${locale}/account`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full"
                >
                  <User className="h-4 w-4" />
                  {navT('account')}
                </Link>

                <div className="border-t my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  {navT('logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
