'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SiteSettingsFormProps {
  locale: string;
}

export default function SiteSettingsForm({ locale }: SiteSettingsFormProps) {
  const t = useTranslations('admin.settings');
  const commonT = useTranslations('common');
  const router = useRouter();

  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/settings/site');
        const data = await res.json();
        if (res.ok) {
          setSiteName(data.siteName || '');
          setSiteDescription(data.siteDescription || '');
          setSiteKeywords(data.siteKeywords || '');
          setLogoUrl(data.logoUrl || '');
          setFaviconUrl(data.faviconUrl || '');
          setContactEmail(data.contactEmail || '');
          setContactPhone(data.contactPhone || '');
          setContactAddress(data.contactAddress || '');
          setSocialLinks(data.socialLinks || socialLinks);
        }
      } catch (err) {
        console.error('Fetch settings error:', err);
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
      const res = await fetch('/api/admin/settings/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          siteDescription,
          siteKeywords,
          logoUrl,
          faviconUrl,
          contactEmail,
          contactPhone,
          contactAddress,
          socialLinks,
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

      {/* Basic Info */}
      <div className="bg-card border rounded-lg p-6 space-y-5">
        <h3 className="text-lg font-semibold mb-2">{t('siteBasic')}</h3>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('siteName')} *</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder={t('siteNamePlaceholder')}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isSaving}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('siteDescription')}</label>
          <textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder={t('siteDescriptionPlaceholder')}
            rows={3}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('siteKeywords')}</label>
          <input
            type="text"
            value={siteKeywords}
            onChange={(e) => setSiteKeywords(e.target.value)}
            placeholder={t('siteKeywordsPlaceholder')}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('logoUrl')}</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder={t('logoUrlPlaceholder')}
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('faviconUrl')}</label>
            <input
              type="url"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder={t('logoUrlPlaceholder')}
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-card border rounded-lg p-6 space-y-5">
        <h3 className="text-lg font-semibold mb-2">{t('contactInfo')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('contactEmail')}</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={t('contactEmailPlaceholder')}
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('contactPhone')}</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={t('contactPhonePlaceholder')}
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('contactAddress')}</label>
          <textarea
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            placeholder={t('contactAddressPlaceholder')}
            rows={2}
            className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card border rounded-lg p-6 space-y-5">
        <h3 className="text-lg font-semibold mb-2">{t('socialLinks')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('facebook')}</label>
            <input
              type="url"
              value={socialLinks.facebook}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, facebook: e.target.value })
              }
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('instagram')}</label>
            <input
              type="url"
              value={socialLinks.instagram}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, instagram: e.target.value })
              }
              placeholder="https://instagram.com/..."
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('twitter')}</label>
            <input
              type="url"
              value={socialLinks.twitter}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, twitter: e.target.value })
              }
              placeholder="https://twitter.com/..."
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('linkedin')}</label>
            <input
              type="url"
              value={socialLinks.linkedin}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, linkedin: e.target.value })
              }
              placeholder="https://linkedin.com/..."
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5">{t('youtube')}</label>
            <input
              type="url"
              value={socialLinks.youtube}
              onChange={(e) =>
                setSocialLinks({ ...socialLinks, youtube: e.target.value })
              }
              placeholder="https://youtube.com/@..."
              className="w-full px-3 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isSaving}
            />
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
