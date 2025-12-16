'use client';

import React, { useState } from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';

interface NewsletterProps {
  section: SectionSettings;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  storeId?: number;
}

export function Newsletter({ section, onUpdate, storeId }: NewsletterProps) {
  const settings = section.settings || {};
  const style = section.style || {};
  const blocks = section.blocks || [];
  const { t } = useTranslation('storefront');
  
  const [email, setEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const textBlock = blocks[0]; // Assuming single block for content as per template
  const showPrivacyConsent = settings.show_privacy_consent !== false;

  // Width Logic
  const getWidthClass = () => {
     return settings.content_width === 'narrow' ? 'max-w-2xl' : 'max-w-4xl';
  };

  // Height Logic
  const getHeightClass = () => {
    switch (settings.height) {
        case 'small': return 'py-12';
        case 'large': return 'py-24';
        case 'medium': 
        default: return 'py-16';
    }
  };
  
  // Button Styles
  const getButtonStyles = () => {
    const buttonStyleObj = style.button || {};
    const buttonStyle = buttonStyleObj.style || 'solid';
    const borderRadius = buttonStyleObj.border_radius || '8px';

    const baseClasses = 'px-6 py-3 transition-all font-medium whitespace-nowrap';

    let styleClasses = '';
    let inlineStyles: React.CSSProperties = {
      borderRadius: buttonStyle === 'underline' ? '0' : borderRadius,
    };

    switch (buttonStyle) {
      case 'outline':
        styleClasses = 'border-2';
        inlineStyles = {
          ...inlineStyles,
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'white':
        styleClasses = 'border border-white shadow-sm';
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: '#FFFFFF',
          color: '#000000',
        };
        break;
      case 'black':
        styleClasses = 'border border-black';
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: '#000000',
          color: '#FFFFFF',
        };
        break;
      case 'underline':
        styleClasses = 'border-b-2 px-0 py-2';
        inlineStyles = {
          ...inlineStyles,
          borderRadius: '0',
          borderColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#2563EB',
          backgroundColor: 'transparent',
        };
        break;
      case 'solid':
      default:
        inlineStyles = {
          ...inlineStyles,
          backgroundColor: buttonStyleObj.background_color || '#2563EB',
          color: buttonStyleObj.text_color || '#FFFFFF',
        };
        break;
    }

    return { className: `${baseClasses} ${styleClasses}`, style: inlineStyles };
  };

  const fontFamily = style.typography?.font_family || '"Noto Sans Hebrew", sans-serif';
  const textColor = style.typography?.color || '#111827'; // Dark text by default for light bg

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }

    if (showPrivacyConsent && !privacyConsent) {
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
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          email,
          email_marketing_consent: true,
          source: 'newsletter',
          category_types: ['NEWSLETTER'],
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
        setPrivacyConsent(false);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting newsletter:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className={`w-full ${getHeightClass()}`} style={{ fontFamily }}>
        <div className="container mx-auto px-4">
          <div className={`${getWidthClass()} mx-auto text-center`}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: textColor }}>
              {settings.success_message || t('newsletter.success') || 'תודה שנרשמת!'}
            </h2>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="mt-4 px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              {t('newsletter.subscribe_another') || 'הירשם עם מייל אחר'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${getHeightClass()}`} style={{ fontFamily }}>
      <div className="container mx-auto px-4">
        <div className={`${getWidthClass()} mx-auto text-center`}>
          {textBlock?.content?.heading && (
            <h2 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
                {textBlock.content.heading}
            </h2>
          )}
          
          {textBlock?.content?.subheading && (
            <p className="mb-8 text-lg" style={{ color: textColor ? `${textColor}CC` : '#4B5563' }}>
                {textBlock.content.subheading}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={settings.form_settings?.email_placeholder || t('newsletter.email_placeholder') || 'הכנס את כתובת המייל'}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-shadow"
                style={{ textAlign: 'right' }}
                required
                dir="ltr"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                {...getButtonStyles()}
                className={`${getButtonStyles().className} disabled:opacity-50`}
                onMouseEnter={(e) => {
                    const hoverBg = style.button?.hover_background_color;
                    const hoverText = style.button?.hover_text_color;
                    if (hoverBg) e.currentTarget.style.backgroundColor = hoverBg;
                    if (hoverText) e.currentTarget.style.color = hoverText;
                }}
                onMouseLeave={(e) => {
                    const normalBg = style.button?.background_color || '#2563EB';
                    const normalText = style.button?.text_color || '#FFFFFF';
                    const bStyle = style.button?.style || 'solid';
                    
                    if (bStyle === 'solid') {
                        e.currentTarget.style.backgroundColor = normalBg;
                        e.currentTarget.style.color = normalText;
                    } else if (bStyle === 'outline' || bStyle === 'underline') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = normalText;
                    }
                }}
              >
                {isSubmitting ? '...' : (textBlock?.content?.button_text || t('newsletter.subscribe') || 'הירשם')}
              </button>
            </div>

            {showPrivacyConsent && (
              <label className="flex items-center justify-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-400"
                  required
                />
                <span className="text-sm" style={{ color: textColor }}>
                  {settings.privacy_text || t('newsletter.privacy_consent') || 'אני מאשר/ת את'}{' '}
                  <a href={settings.privacy_url || '/privacy-policy'} target="_blank" className="text-gray-600 hover:underline">
                    {t('newsletter.privacy_policy') || 'מדיניות הפרטיות'}
                  </a>
                </span>
              </label>
            )}

            {submitStatus === 'error' && (
              <p className="text-rose-400 text-sm">{t('newsletter.error') || 'אירעה שגיאה. אנא נסו שוב.'}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
