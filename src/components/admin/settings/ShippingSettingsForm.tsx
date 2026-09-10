'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, Truck, Gift } from 'lucide-react';

interface ShippingSettingsFormProps {
  locale: string;
}

export default function ShippingSettingsForm({ locale }: ShippingSettingsFormProps) {
  const t = useTranslations('admin.settings');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [defaultShippingFee, setDefaultShippingFee] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/settings/shipping');
        const data = await res.json();
        if (res.ok) {
          setDefaultShippingFee(String(data.defaultShippingFee || 0));
          setFreeShippingThreshold(String(data.freeShippingThreshold || 0));
        }
      } catch (err) {
        console.error('Fetch shipping settings error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setError('');

    try {
      const res = await fetch('/api/admin/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultShippingFee: parseFloat(defaultShippingFee) || 0,
          freeShippingThreshold: parseFloat(freeShippingThreshold) || 0,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
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

      {/* Shipping Settings */}
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold">{t('shippingTitle')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mt-0.5">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5">
                  {t('baseShippingFee')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultShippingFee}
                    onChange={(e) => setDefaultShippingFee(e.target.value)}
                    placeholder={t('baseShippingFeePlaceholder')}
                    className="w-full pl-7 pr-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg mt-0.5">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5">
                  {t('freeShippingThreshold')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder={t('freeShippingThresholdPlaceholder')}
                    className="w-full pl-7 pr-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isSaving}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('freeShippingThresholdDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
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
