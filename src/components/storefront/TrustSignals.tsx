'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';

interface TrustSignal {
  icon: string;
  text: string;
}

export function TrustSignals() {
  const { t, loading: translationsLoading } = useTranslation('storefront');

  const signals: TrustSignal[] = [
    {
      icon: '✓',
      text: t('checkout.trust_easy_returns') || 'החזרות קלות תוך 30 יום',
    },
    {
      icon: '🔒',
      text: t('checkout.trust_secure') || 'תשלום מאובטח',
    },
    {
      icon: '🚚',
      text: t('checkout.trust_free_shipping') || 'משלוח חינם בהזמנות מעל ₪125',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-6 py-4 border-t border-gray-200 mt-6">
      {signals.map((signal, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm text-gray-600"
          role="listitem"
        >
          <span className="text-base" aria-hidden="true">{signal.icon}</span>
          {translationsLoading ? (
            <TextSkeleton width="w-32" height="h-4" />
          ) : (
            <span>{signal.text}</span>
          )}
        </div>
      ))}
    </div>
  );
}

