'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  callbackUrl: string;
  error?: string;
  locale: string;
}

export default function LoginForm({ callbackUrl, error, locale }: LoginFormProps) {
  const t = useTranslations('auth');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 客户端验证
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = commonT('required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = commonT('invalidEmail');
    }

    if (!password) {
      newErrors.password = commonT('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setServerError(
          locale === 'zh'
            ? '邮箱或密码错误，请重试'
            : 'Invalid email or password. Please try again.'
        );
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setServerError(
        locale === 'zh'
          ? '登录失败，请稍后重试'
          : 'Login failed. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('login')}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t('noAccount')}{' '}
          <Link
            href={`/${locale}/register`}
            className="text-primary font-medium hover:underline"
          >
            {t('signUpHere')}
          </Link>
        </p>
      </div>

      {/* 错误提示 */}
      {(serverError || error) && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {serverError ||
              (error === 'CredentialsSignin'
                ? locale === 'zh'
                  ? '邮箱或密码错误'
                  : 'Invalid credentials'
                : locale === 'zh'
                ? '登录失败，请重试'
                : 'Login failed, please try again')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 邮箱 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.email ? 'border-destructive' : 'border-input'
            }`}
            placeholder="name@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        {/* 密码 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.password ? 'border-destructive' : 'border-input'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {/* 记住我 + 忘记密码 */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground">{t('rememberMe')}</span>
          </label>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-sm text-primary hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('loginButton')}
        </button>
      </form>
    </div>
  );
}
