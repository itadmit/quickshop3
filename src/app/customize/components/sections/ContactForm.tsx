'use client';

import React, { useState } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { sectionPropsAreEqual } from './sectionMemoUtils';

interface ContactFormProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  storeId?: number;
}

function ContactFormComponent({ section, onUpdate, storeId }: ContactFormProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    privacyConsent: false,
    marketingConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const textColor = style.typography?.color;
  const buttonBg = style.button?.background_color || '#111827';
  const buttonText = style.button?.text_color || '#FFFFFF';

  // Default settings
  const showEmail = settings.show_email !== false;
  const showPhone = settings.show_phone === true;
  const showSubject = settings.show_subject !== false;
  const showPrivacyConsent = settings.show_privacy_consent !== false;
  const showMarketingConsent = settings.show_marketing_consent === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (showPrivacyConsent && !formData.privacyConsent) {
      alert('יש לאשר את מדיניות הפרטיות');
      return;
    }

    if (!storeId) {
      console.log('Preview mode - form not submitted');
      setSubmitStatus('success');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Split name into first and last
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          email: formData.email || `contact_${Date.now()}@temp.com`, // Fallback if no email
          first_name: firstName,
          last_name: lastName,
          phone: formData.phone || null,
          notes: `נושא: ${formData.subject}\n\nהודעה:\n${formData.message}`,
          email_marketing_consent: formData.marketingConsent,
          source: 'contact_form',
          category_types: ['CONTACT_FORM'],
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          privacyConsent: false,
          marketingConsent: false,
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: textColor }}>
            {settings.success_message || 'ההודעה נשלחה בהצלחה!'}
          </h2>
          <button
            onClick={() => setSubmitStatus('idle')}
            className="mt-4 px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            שלח הודעה נוספת
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
            {settings.title || 'צור קשר'}
          </h2>
          <p className="text-lg opacity-80" style={{ color: textColor }}>
            {settings.subtitle || 'השאירו פרטים ונחזור אליכם בהקדם'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className={`grid grid-cols-1 ${showEmail || showPhone ? 'md:grid-cols-2' : ''} gap-6`}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: textColor }}>שם מלא *</label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all bg-white"
                placeholder="ישראל ישראלי"
              />
            </div>
            
            {showEmail && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: textColor }}>אימייל *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
            )}

            {showPhone && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: textColor }}>טלפון</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all bg-white"
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>
            )}
          </div>
          
          {showSubject && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1" style={{ color: textColor }}>נושא</label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all bg-white"
                placeholder="בנושא מה הפנייה?"
              />
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1" style={{ color: textColor }}>הודעה *</label>
            <textarea
              id="message"
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none bg-white"
              placeholder="כתוב כאן את הודעתך..."
            />
          </div>

          {/* Consent Checkboxes */}
          {(showPrivacyConsent || showMarketingConsent) && (
            <div className="space-y-3">
              {showPrivacyConsent && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                    className="mt-1 w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-400"
                    required
                  />
                  <span className="text-sm" style={{ color: textColor }}>
                    {settings.privacy_text || 'אני מאשר/ת את'}{' '}
                    <a href={settings.privacy_url || '/privacy-policy'} target="_blank" className="text-gray-600 hover:underline">
                      מדיניות הפרטיות
                    </a> *
                  </span>
                </label>
              )}

              {showMarketingConsent && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="mt-1 w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-400"
                  />
                  <span className="text-sm" style={{ color: textColor }}>
                    {settings.marketing_text || 'אני מאשר/ת לקבל עדכונים ומבצעים במייל'}
                  </span>
                </label>
              )}
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              אירעה שגיאה בשליחת הטופס. אנא נסו שוב.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-gray-200 disabled:opacity-50"
            style={{ backgroundColor: buttonBg, color: buttonText }}
          >
            {isSubmitting ? 'שולח...' : (settings.submit_text || 'שלח הודעה')}
          </button>
        </form>
      </div>
    </div>
  );
}

export const ContactForm = React.memo(ContactFormComponent, sectionPropsAreEqual);
