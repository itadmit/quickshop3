'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';

interface GDPRSettings {
  enabled: boolean;
  useCustomText: boolean;
  customPolicyText: string;
  acceptButtonText: string;
  declineButtonText: string;
  bannerPosition: 'bottom' | 'top';
  bannerStyle: 'full-width' | 'box-right' | 'box-left';
  showDeclineButton: boolean;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

interface CookieBannerProps {
  storeSlug: string;
  translations: {
    cookieNotice: string;
    cookieDescription: string;
    accept: string;
    decline: string;
    learnMore: string;
    showLess: string;
  };
}

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_CONSENT_EXPIRY = 365 * 24 * 60 * 60 * 1000; // 1 year

export function CookieBanner({ storeSlug, translations }: CookieBannerProps) {
  const [settings, setSettings] = useState<GDPRSettings | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      try {
        const parsedConsent = JSON.parse(consent);
        if (parsedConsent.expiry > Date.now()) {
          setIsLoading(false);
          return; // Already has valid consent
        }
      } catch {
        // Invalid consent, continue to show banner
      }
    }

    // Fetch GDPR settings
    fetchSettings();
  }, [storeSlug]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/storefront/${storeSlug}/gdpr`);
      if (response.ok) {
        const data = await response.json();
        if (data.enabled && data.settings) {
          setSettings(data.settings);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching GDPR settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: true,
        timestamp: Date.now(),
        expiry: Date.now() + COOKIE_CONSENT_EXPIRY,
      })
    );
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: false,
        timestamp: Date.now(),
        expiry: Date.now() + COOKIE_CONSENT_EXPIRY,
      })
    );
    setIsVisible(false);
  };

  if (isLoading || !isVisible || !settings) {
    return null;
  }

  const acceptText = settings.acceptButtonText || translations.accept;
  const declineText = settings.declineButtonText || translations.decline;

  // Position classes
  const positionClasses = settings.bannerPosition === 'top' ? 'top-0' : 'bottom-0';
  
  // Style classes
  const styleClasses = 
    settings.bannerStyle === 'full-width'
      ? 'left-0 right-0'
      : settings.bannerStyle === 'box-right'
      ? `right-4 left-auto max-w-md ${settings.bannerPosition === 'top' ? 'top-4' : 'bottom-4'} rounded-lg`
      : `left-4 right-auto max-w-md ${settings.bannerPosition === 'top' ? 'top-4' : 'bottom-4'} rounded-lg`;

  const isBoxStyle = settings.bannerStyle !== 'full-width';

  return (
    <div
      className={`fixed z-50 ${positionClasses} ${styleClasses} shadow-2xl transition-all duration-300 ease-out animate-in ${
        settings.bannerPosition === 'bottom' ? 'slide-in-from-bottom-5' : 'slide-in-from-top-5'
      }`}
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
      dir="rtl"
    >
      <div className={`p-4 ${isBoxStyle ? '' : 'container mx-auto'}`}>
        <div className={`flex ${isBoxStyle ? 'flex-col gap-4' : 'flex-col md:flex-row items-start md:items-center gap-4'}`}>
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="w-5 h-5" />
              <span className="font-semibold">{translations.cookieNotice}</span>
            </div>
            
            {settings.useCustomText && settings.customPolicyText ? (
              <div className="text-sm opacity-90">
                {showFullText ? (
                  <div className="whitespace-pre-wrap">{settings.customPolicyText}</div>
                ) : (
                  <p>{settings.customPolicyText.slice(0, 150)}...</p>
                )}
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="flex items-center gap-1 mt-2 text-sm underline opacity-80 hover:opacity-100"
                >
                  {showFullText ? (
                    <>
                      {translations.showLess}
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      {translations.learnMore}
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm opacity-90">{translations.cookieDescription}</p>
            )}
          </div>

          {/* Buttons */}
          <div className={`flex gap-2 ${isBoxStyle ? 'w-full' : 'shrink-0'}`}>
            <button
              onClick={handleAccept}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 hover:scale-105 ${
                isBoxStyle ? 'flex-1' : ''
              }`}
              style={{
                backgroundColor: settings.buttonColor,
                color: settings.buttonTextColor,
              }}
            >
              {acceptText}
            </button>
            
            {settings.showDeclineButton && (
              <button
                onClick={handleDecline}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80 ${
                  isBoxStyle ? 'flex-1' : ''
                }`}
                style={{
                  borderColor: settings.textColor,
                  color: settings.textColor,
                  backgroundColor: 'transparent',
                }}
              >
                {declineText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

