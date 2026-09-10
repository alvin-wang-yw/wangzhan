'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface RegisterFormProps {
  callbackUrl: string;
  locale: string;
}

export default function RegisterForm({ callbackUrl, locale }: RegisterFormProps) {
  const t = useTranslations('auth');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 客户端验证
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = commonT('required');
    } else if (name.length > 50) {
      newErrors.name =
        locale === 'zh' ? '姓名不能超过50个字符' : 'Name must be less than 50 characters';
    }

    if (!email.trim()) {
      newErrors.email = commonT('required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = commonT('invalidEmail');
    }

    if (!password) {
      newErrors.password = commonT('required');
    } else if (password.length < 6) {
      newErrors.password =
        locale === 'zh' ? '密码至少需要6个字符' : 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = commonT('required');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        locale === 'zh' ? '两次密码不一致' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccess(false);

    if (!validate()) return;

    setIsLoading(true);

    try {
      // 调用注册 API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          locale,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        if (data.message) {
          setServerError(data.message);
        }
        return;
      }

      // 注册成功，自动登录
      setSuccess(true);

      const signInResult = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        // 自动登录失败，跳转到登录页
        router.push(`/${locale}/login?registered=true`);
        router.refresh();
      }
    } catch {
      setServerError(
        locale === 'zh'
          ? '注册失败，请稍后重试'
          : 'Registration failed. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('register')}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t('hasAccount')}{' '}
          <Link
            href={`/${locale}/login`}
            className="text-primary font-medium hover:underline"
          >
            {t('signInHere')}
          </Link>
        </p>
      </div>

      {/* 成功提示 */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">
            {locale === 'zh' ? '注册成功，正在登录...' : 'Registration successful, signing you in...'}
          </p>
        </div>
      )}

      {/* 错误提示 */}
      {serverError && !success && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 姓名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            {t('name')}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.name ? 'border-destructive' : 'border-input'
            }`}
            placeholder={locale === 'zh' ? '请输入姓名' : 'Enter your name'}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name}</p>
          )}
        </div>

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

        {/* 确认密码 */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
            {t('confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.confirmPassword ? 'border-destructive' : 'border-input'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* 服务条款 */}
        <p className="text-xs text-muted-foreground">
          {t('agreeTerms')}
        </p>

        {/* 注册按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('registerButton')}
        </button>
      </form>
    </div>
  );
}
