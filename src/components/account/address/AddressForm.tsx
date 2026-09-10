'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface AddressFormProps {
  locale: string;
  address?: Address | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  isEdit?: boolean;
}

export default function AddressForm({
  locale,
  address,
  isOpen,
  onClose,
  onSaved,
  isEdit = false,
}: AddressFormProps) {
  const t = useTranslations('account.addresses');
  const commonT = useTranslations('common');
  const checkoutT = useTranslations('checkout');
  const router = useRouter();

  const [firstName, setFirstName] = useState(address?.firstName || '');
  const [lastName, setLastName] = useState(address?.lastName || '');
  const [company, setCompany] = useState(address?.company || '');
  const [addressLine1, setAddressLine1] = useState(address?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(address?.addressLine2 || '');
  const [city, setCity] = useState(address?.city || '');
  const [state, setState] = useState(address?.state || '');
  const [postalCode, setPostalCode] = useState(address?.postalCode || '');
  const [country, setCountry] = useState(address?.country || '');
  const [phone, setPhone] = useState(address?.phone || '');
  const [isDefault, setIsDefault] = useState(address?.isDefault || false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = commonT('required');
    if (!lastName.trim()) newErrors.lastName = commonT('required');
    if (!addressLine1.trim()) newErrors.addressLine1 = commonT('required');
    if (!city.trim()) newErrors.city = commonT('required');
    if (!postalCode.trim()) newErrors.postalCode = commonT('required');
    if (!country.trim()) newErrors.country = commonT('required');
    if (!phone.trim()) newErrors.phone = commonT('required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const url = isEdit
        ? `/api/account/addresses/${address!.id}`
        : '/api/account/addresses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          company,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          phone,
          isDefault,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setServerError(
          data.error || (locale === 'zh' ? '保存失败，请重试' : 'Failed to save address')
        );
        return;
      }

      onSaved();
      onClose();
      router.refresh();
    } catch {
      setServerError(
        locale === 'zh' ? '保存失败，请稍后重试' : 'Failed to save. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('editTitle') : t('newTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {serverError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('firstName')} *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.firstName ? 'border-destructive' : 'border-input'
                }`}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('lastName')} *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.lastName ? 'border-destructive' : 'border-input'
                }`}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('company')}</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('addressLine1')} *
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.addressLine1 ? 'border-destructive' : 'border-input'
              }`}
              disabled={isLoading}
            />
            {errors.addressLine1 && (
              <p className="mt-1 text-xs text-destructive">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('addressLine2')}</label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('city')} *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.city ? 'border-destructive' : 'border-input'
                }`}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="mt-1 text-xs text-destructive">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t('state')}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('postalCode')} *
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.postalCode ? 'border-destructive' : 'border-input'
                }`}
                disabled={isLoading}
              />
              {errors.postalCode && (
                <p className="mt-1 text-xs text-destructive">{errors.postalCode}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('country')} *
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  errors.country ? 'border-destructive' : 'border-input'
                }`}
                disabled={isLoading}
              />
              {errors.country && (
                <p className="mt-1 text-xs text-destructive">{errors.country}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('phone')} *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.phone ? 'border-destructive' : 'border-input'
              }`}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary/50"
              disabled={isLoading}
            />
            <label htmlFor="isDefault" className="text-sm text-foreground">
              {t('setDefault')}
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50"
            >
              {commonT('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('saveAddress')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
