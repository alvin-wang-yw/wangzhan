'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { MapPin, Edit2, Trash2, Plus, Loader2, Check, Trash } from 'lucide-react';
import AddressForm from './AddressForm';

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

interface AddressListProps {
  locale: string;
}

export default function AddressList({ locale }: AddressListProps) {
  const t = useTranslations('account.addresses');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/addresses');
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        setSuccessMsg(t('addressDeleted'));
        setTimeout(() => setSuccessMsg(''), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error('Delete address error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionLoading(id);
    try {
      const address = addresses.find((a) => a.id === id);
      if (!address) return;

      const res = await fetch(`/api/account/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...address,
          isDefault: true,
        }),
      });

      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
        setSuccessMsg(t('addressSetDefault'));
        setTimeout(() => setSuccessMsg(''), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error('Set default address error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaved = () => {
    fetchAddresses();
    setSuccessMsg(t('addressSaved'));
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('addNew')}
        </button>
      </div>

      {/* Address list */}
      {addresses.length === 0 ? (
        <div className="border rounded-lg bg-card p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="font-medium text-foreground mb-1">{t('noAddresses')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('noAddressesDesc')}</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('addNew')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-lg bg-card p-5 relative transition-all ${
                address.isDefault ? 'border-primary ring-1 ring-primary' : ''
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  <Check className="h-3 w-3" />
                  {t('isDefault')}
                </span>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {address.firstName} {address.lastName}
                  </p>
                  {address.company && (
                    <p className="text-sm text-muted-foreground">{address.company}</p>
                  )}
                </div>
              </div>

              <div className="text-sm text-foreground space-y-0.5 mb-4 pl-13">
                <p>
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                </p>
                <p>
                  {address.city}
                  {address.state && `, ${address.state}`} {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p className="text-muted-foreground">{address.phone}</p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    disabled={actionLoading === address.id}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {t('setDefault')}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => handleEdit(address)}
                  disabled={actionLoading === address.id}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                  title={commonT('edit')}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={actionLoading === address.id}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                  title={commonT('delete')}
                >
                  {actionLoading === address.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address form modal */}
      <AddressForm
        locale={locale}
        address={editingAddress}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        isEdit={!!editingAddress}
      />
    </div>
  );
}
