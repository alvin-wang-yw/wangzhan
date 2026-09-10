'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';

interface ChangePasswordFormProps {
  locale: string;
}

export default function ChangePasswordForm({ locale }: ChangePasswordFormProps) {
  const t = useTranslations('account');
  const commonT = useTranslations('common');
  const authT = useTranslations('auth');
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = commonT('required');
    }
    if (!newPassword) {
      newErrors.newPassword = commonT('required');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = authT('passwordTooShort');
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = commonT('required');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = authT('passwordsDoNotMatch');
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
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setServerError(
          data.error ||
            (locale === 'zh' ? '修改失败，请重试' : 'Failed to change password')
        );
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setServerError(
        locale === 'zh' ? '修改失败，请稍后重试' : 'Failed to change password. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg bg-card p-6 max-w-lg">
      {/* 成功提示 */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{t('passwordChanged')}</p>
        </div>
      )}

      {/* 错误提示 */}
      {serverError && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t('changePassword')}</h3>
          <p className="text-xs text-muted-foreground">
            {locale === 'zh'
              ? '定期修改密码可提高账户安全性'
              : 'Regularly update your password for better security'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 当前密码 */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium mb-1.5">
            {t('currentPassword')}
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.currentPassword ? 'border-destructive' : 'border-input'
            }`}
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-destructive">{errors.currentPassword}</p>
          )}
        </div>

        {/* 新密码 */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5">
            {t('newPassword')}
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
              errors.newPassword ? 'border-destructive' : 'border-input'
            }`}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p>
          )}
        </div>

        {/* 确认新密码 */}
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
            disabled={isLoading}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
          )}
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
