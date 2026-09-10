'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  avatar: string | null;
  role: string;
}

interface ProfileFormProps {
  user: UserProfile;
  locale: string;
}

export default function ProfileForm({ user, locale }: ProfileFormProps) {
  const t = useTranslations('account');
  const authT = useTranslations('auth');
  const checkoutT = useTranslations('checkout');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [company, setCompany] = useState(user.company || '');
  const [country, setCountry] = useState(user.country || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = commonT('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setServerError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, company, country, locale }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setServerError(
          data.message ||
            (locale === 'zh' ? '保存失败，请重试' : 'Failed to save, please try again')
        );
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setServerError(
        locale === 'zh' ? '保存失败，请稍后重试' : 'Failed to save. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg bg-card p-6">
      {/* 成功提示 */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">
            {locale === 'zh' ? '个人信息已更新' : 'Profile updated successfully'}
          </p>
        </div>
      )}

      {/* 错误提示 */}
      {serverError && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
        {/* 邮箱（只读） */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {authT('email')}
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2.5 border rounded-md bg-muted text-muted-foreground text-sm cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {locale === 'zh' ? '邮箱不可修改' : 'Email cannot be changed'}
          </p>
        </div>

        {/* 姓名 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            {authT('name')}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.name ? 'border-destructive' : 'border-input'
            }`}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* 电话 */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            {checkoutT('phone')}
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* 公司 */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-1.5">
            {checkoutT('company')}
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* 国家 */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1.5">
            {checkoutT('country')}
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* 提交按钮 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
