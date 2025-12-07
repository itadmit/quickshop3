'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { HiMail, HiPhone, HiUser, HiOfficeBuilding, HiPaperAirplane } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { useTranslation } from '@/hooks/useTranslation';

interface ContactFormProps {
  storeId: number;
  storeSlug: string;
}

export function ContactForm({ storeId, storeSlug }: ContactFormProps) {
  const { toast } = useOptimisticToast();
  const { t } = useTranslation('storefront');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    message: '',
    emailMarketingConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: t('common.messages.error') || 'שגיאה',
        description: t('contact.form.email_required') || 'אנא הזן כתובת אימייל',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeId, // Pass storeId for storefront submissions
          email: formData.email,
          first_name: formData.firstName || undefined,
          last_name: formData.lastName || undefined,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          notes: formData.message || undefined,
          category_types: ['CONTACT_FORM'],
          email_marketing_consent: formData.emailMarketingConsent,
          source: 'contact_form',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit contact form');
      }

      toast({
        title: t('common.messages.success') || 'הצלחה',
        description: t('contact.form.success') || 'ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.',
      });

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        company: '',
        message: '',
        emailMarketingConsent: false,
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        title: t('common.messages.error') || 'שגיאה',
        description: error.message || t('contact.form.error') || 'אירעה שגיאה בשליחת הטופס',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('contact.form.title') || 'שלח לנו הודעה'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <HiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('contact.form.first_name') || 'שם פרטי'}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="pr-10"
              />
            </div>
            <div className="relative">
              <HiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('contact.form.last_name') || 'שם משפחה'}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="pr-10"
              />
            </div>
          </div>

          <div className="relative">
            <HiMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="email"
              placeholder={`${t('contact.form.email') || 'אימייל'} *`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="pr-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <HiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="tel"
                placeholder={t('contact.form.phone') || 'טלפון'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pr-10"
              />
            </div>
            <div className="relative">
              <HiOfficeBuilding className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('contact.form.company') || 'חברה'}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="pr-10"
              />
            </div>
          </div>

          <div>
            <textarea
              placeholder={t('contact.form.message') || 'הודעה'}
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emailConsent"
              checked={formData.emailMarketingConsent}
              onChange={(e) => setFormData({ ...formData, emailMarketingConsent: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="emailConsent" className="text-sm text-gray-700 cursor-pointer">
              {t('contact.form.email_consent') || 'אני מסכים לקבל עדכונים ופרסומות במייל'}
            </label>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                {t('contact.form.submitting') || 'שולח...'}
              </>
            ) : (
              <>
                <HiPaperAirplane className="w-4 h-4 ml-2" />
                {t('contact.form.submit') || 'שלח הודעה'}
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

