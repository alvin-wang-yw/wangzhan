'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import {
  Menu,
  X,
  ShoppingCart,
  Search,
  User,
  Globe,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderClientProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: 'ADMIN' | 'USER';
  } | null;
}

/**
 * 顶部导航 - 客户端组件
 * 负责所有交互逻辑：移动菜单、语言切换、用户下拉菜单、购物车数量
 */
export default function HeaderClient({ user }: HeaderClientProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // 从路径中提取当前语言
  const currentLocale = pathname.split('/')[1] || 'en';
  const isLoggedIn = !!user;

  // 获取购物车数量
  const fetchCartCount = async () => {
    if (isLoggedIn) {
      try {
        // 如果本地有购物车，先合并到服务器
        try {
          const stored = localStorage.getItem('cart');
          if (stored) {
            const localItems = JSON.parse(stored);
            if (localItems.length > 0) {
              await fetch('/api/cart/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: localItems }),
              });
              // 合并后清空本地
              localStorage.removeItem('cart');
            }
          }
        } catch {
          // 忽略合并错误
        }

        const res = await fetch('/api/cart');
        const data = await res.json();
        if (res.ok && data.summary) {
          setCartCount(data.summary.itemCount || 0);
        }
      } catch {
        // 忽略错误
      }
    } else {
      // 从 localStorage 读取
      try {
        const stored = localStorage.getItem('cart');
        if (stored) {
          const items = JSON.parse(stored);
          const count = items.reduce(
            (sum: number, item: { quantity: number }) => sum + item.quantity,
            0
          );
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    }
  };

  // 初始加载 + 监听购物车更新事件
  useEffect(() => {
    fetchCartCount();

    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdated);

    // 未登录时，监听 storage 事件（多标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        fetchCartCount();
      }
    };

    if (!isLoggedIn) {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isLoggedIn]);

  // 切换语言
  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    const newPath = segments.join('/') || `/${locale}`;
    router.push(newPath);
    setLangMenuOpen(false);
  };

  // 检查当前路径是否激活
  const isActive = (path: string) => {
    const localePath = `/${currentLocale}${path === '/' ? '' : path}`;
    return pathname === localePath || (path !== '/' && pathname?.startsWith(localePath));
  };

  // 退出登录
  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUserMenuOpen(false);
    router.push(`/${currentLocale}/login`);
    router.refresh();
  };

  // 导航链接
  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/products', label: t('products') },
    { href: '/categories', label: t('categories') },
    { href: '/blog', label: t('blog') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={`/${currentLocale}`} className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">TechTrade Pro</span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${currentLocale}${link.href === '/' ? '' : link.href}`}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 搜索按钮 */}
          <button
            className="p-2 hover:bg-accent rounded-md transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* 购物车 */}
          <Link
            href={`/${currentLocale}/cart`}
            className="p-2 hover:bg-accent rounded-md transition-colors relative"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* 语言切换 */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setUserMenuOpen(false);
              }}
              className="p-2 hover:bg-accent rounded-md transition-colors flex items-center gap-1"
              aria-label="Language"
            >
              <Globe className="h-5 w-5" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-32 rounded-md border bg-popover p-1 shadow-md z-50">
                  <button
                    onClick={() => switchLocale('en')}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors',
                      currentLocale === 'en' && 'bg-accent font-medium'
                    )}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    onClick={() => switchLocale('zh')}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors',
                      currentLocale === 'zh' && 'bg-accent font-medium'
                    )}
                  >
                    🇨🇳 简体中文
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 用户菜单 - 已登录 */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setLangMenuOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-md z-50 py-1">
                    {/* 用户信息 */}
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name || t('account')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* 管理员入口 */}
                    {user.role === 'ADMIN' && (
                      <Link
                        href={`/${currentLocale}/admin`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full"
                      >
                        <Shield className="h-4 w-4" />
                        {t('adminPanel') || 'Admin Panel'}
                      </Link>
                    )}

                    {/* 个人中心 */}
                    <Link
                      href={`/${currentLocale}/account`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full"
                    >
                      <User className="h-4 w-4" />
                      {t('account')}
                    </Link>

                    <div className="border-t my-1" />

                    {/* 退出登录 */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // 未登录 - 显示登录/注册按钮
            <div className="flex items-center gap-2">
              <Link
                href={`/${currentLocale}/login`}
                className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href={`/${currentLocale}/register`}
                className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          )}

          {/* 移动端菜单按钮 */}
          <button
            className="p-2 hover:bg-accent rounded-md transition-colors md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href === '/' ? '' : link.href}`}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-3 text-sm font-medium rounded-md transition-colors',
                  isActive(link.href)
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t my-2" />
            {/* 购物车（移动端） */}
            <Link
              href={`/${currentLocale}/cart`}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t('cart')}
              </span>
              {cartCount > 0 && (
                <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Link
                  href={`/${currentLocale}/account`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  {t('account')}
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href={`/${currentLocale}/admin`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {t('adminPanel') || 'Admin Panel'}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 text-sm font-medium rounded-md text-destructive text-left hover:bg-destructive/10 transition-colors"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${currentLocale}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${currentLocale}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium rounded-md bg-primary text-primary-foreground text-center"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
