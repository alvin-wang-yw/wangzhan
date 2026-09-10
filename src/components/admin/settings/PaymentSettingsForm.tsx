'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, CreditCard, Landmark, Wallet } from 'lucide-react';

interface PaymentSettingsFormProps {
  locale: string;
}

export default function PaymentSettingsForm({ locale }: PaymentSettingsFormProps) {
  const t = useTranslations('admin.settings');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [stripe, setStripe] = useState({
    enabled: false,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
  });
  const [paypal, setPaypal] = useState({
    enabled: false,
    email: '',
    clientId: '',
    clientSecret: '',
  });
  const [bankTransfer, setBankTransfer] = useState({
    enabled: false,
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/settings/payment');
        const data = await res.json();
        if (res.ok) {
          setStripe(data.stripe || stripe);
          setPaypal(data.paypal || paypal);
          setBankTransfer(data.bankTransfer || bankTransfer);
        }
      } catch (err) {
        console.error('Fetch payment settings error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError('');

    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe, paypal, bankTransfer }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || t('saveFailed'));
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError(t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Success */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{t('saveSuccess')}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Stripe */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{t('stripe')}</h3>
              <p className="text-xs text-muted-foreground">
                {stripe.enabled ? t('enabled') : t('disabled')}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={stripe.enabled}
              onChange={(e) => setStripe({ ...stripe, enabled: e.target.checked })}
              className="sr-only peer"
              disabled={isSaving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        {stripe.enabled && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('publishableKey')}</label>
              <input
                type="text"
                value={stripe.publishableKey}
                onChange={(e) => setStripe({ ...stripe, publishableKey: e.target.value })}
                placeholder="pk_test_..."
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('secretKey')}</label>
              <input
                type="password"
                value={stripe.secretKey}
                onChange={(e) => setStripe({ ...stripe, secretKey: e.target.value })}
                placeholder="sk_test_..."
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('webhookSecret')}</label>
              <input
                type="password"
                value={stripe.webhookSecret}
                onChange={(e) => setStripe({ ...stripe, webhookSecret: e.target.value })}
                placeholder="whsec_..."
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
          </div>
        )}
      </div>

      {/* PayPal */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{t('paypal')}</h3>
              <p className="text-xs text-muted-foreground">
                {paypal.enabled ? t('enabled') : t('disabled')}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={paypal.enabled}
              onChange={(e) => setPaypal({ ...paypal, enabled: e.target.checked })}
              className="sr-only peer"
              disabled={isSaving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        {paypal.enabled && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('paypalEmail')}</label>
              <input
                type="email"
                value={paypal.email}
                onChange={(e) => setPaypal({ ...paypal, email: e.target.value })}
                placeholder="paypal@example.com"
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('paypalClientId')}</label>
              <input
                type="text"
                value={paypal.clientId}
                onChange={(e) => setPaypal({ ...paypal, clientId: e.target.value })}
                placeholder="Client ID"
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('paypalClientSecret')}</label>
              <input
                type="password"
                value={paypal.clientSecret}
                onChange={(e) => setPaypal({ ...paypal, clientSecret: e.target.value })}
                placeholder="Client Secret"
                className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSaving}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bank Transfer */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{t('bankTransfer')}</h3>
              <p className="text-xs text-muted-foreground">
                {bankTransfer.enabled ? t('enabled') : t('disabled')}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bankTransfer.enabled}
              onChange={(e) => setBankTransfer({ ...bankTransfer, enabled: e.target.checked })}
              className="sr-only peer"
              disabled={isSaving}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        {bankTransfer.enabled && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('bankName')}</label>
                <input
                  type="text"
                  value={bankTransfer.bankName}
                  onChange={(e) => setBankTransfer({ ...bankTransfer, bankName: e.target.value })}
                  placeholder="Bank of China"
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('accountName')}</label>
                <input
                  type="text"
                  value={bankTransfer.accountName}
                  onChange={(e) => setBankTransfer({ ...bankTransfer, accountName: e.target.value })}
                  placeholder="Your Company Name"
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('accountNumber')}</label>
                <input
                  type="text"
                  value={bankTransfer.accountNumber}
                  onChange={(e) => setBankTransfer({ ...bankTransfer, accountNumber: e.target.value })}
                  placeholder="Account number"
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('swiftCode')}</label>
                <input
                  type="text"
                  value={bankTransfer.swiftCode}
                  onChange={(e) => setBankTransfer({ ...bankTransfer, swiftCode: e.target.value })}
                  placeholder="SWIFT/BIC code"
                  className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {commonT('save')}
        </button>
      </div>
    </form>
  );
}
