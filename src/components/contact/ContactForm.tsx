'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  User,
  Building2,
  Globe,
  MessageSquare,
} from 'lucide-react';

interface ContactFormProps {
  locale: string;
  defaultProductId?: string;
  defaultProductName?: string;
}

export default function ContactForm({
  locale,
  defaultProductId = '',
  defaultProductName = '',
}: ContactFormProps) {
  const t = useTranslations('contact');
  const commonT = useTranslations('common');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    company: '',
    subject: '',
    message: '',
    productId: defaultProductId,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证
    if (!form.name.trim()) {
      setError(t('name') + ' ' + commonT('required'));
      return;
    }
    if (!form.email.trim()) {
      setError(t('email') + ' ' + commonT('required'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError(commonT('invalidEmail'));
      return;
    }
    if (!form.message.trim()) {
      setError(t('message') + ' ' + commonT('required'));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send');
      }

      setIsSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t('success')}</h2>
        <p className="text-muted-foreground mb-6">{t('successDesc')}</p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setForm({
              name: '',
              email: '',
              phone: '',
              country: '',
              company: '',
              subject: '',
              message: '',
              productId: defaultProductId,
            });
          }}
          className="px-6 py-2 border rounded-md hover:bg-muted transition-colors"
        >
          {t('sendAnother') || 'Send Another Message'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {defaultProductName && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
          <p className="text-sm">
            <span className="text-muted-foreground">Product: </span>
            <span className="font-medium">{defaultProductName}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('name')} <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('email')} <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('phone')}</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('country')}</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('company')}</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('subject')}</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t('message')} <span className="text-destructive">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={5}
          placeholder="Tell us about your requirements, questions, etc."
          className="w-full px-4 py-3 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
        {t('submit')}
      </button>
    </form>
  );
}
