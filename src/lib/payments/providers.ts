import { PaymentProviderConfig, PaymentProviderType } from '@/types/payment';

/**
 * Payment Providers Configuration
 * 
 * כל ספקי התשלום הנתמכים במערכת.
 * ניתן להוסיף ספקים נוספים על ידי הוספה למערך הזה.
 */
export const PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'quickpay',
    name: 'קוויק פיימנטס',
    nameEn: 'QuickShop Payments',
    description: 'הפתרון המובנה שלנו - ללא עמלות נוספות, התממשקות מיידית',
    logo: '/images/providers/quickpay.svg',
    isRecommended: true,
    isComingSoon: true, // TODO: Remove when ready
    requiredFields: [
      // No fields needed - automatic setup
    ],
    supportedFeatures: [
      'credit_card',
      'bit',
      'apple_pay',
      'google_pay',
      'tokenization',
      'recurring',
      'refunds',
      'partial_refunds',
      'installments',
    ],
  },
  {
    id: 'pelecard',
    name: 'פלאקארד',
    nameEn: 'Pelecard',
    description: 'סליקה ישראלית מובילה עם תמיכה בכל כרטיסי האשראי',
    logo: '/images/providers/pelecard.png',
    requiredFields: [
      {
        key: 'terminal_number',
        label: 'מספר טרמינל',
        type: 'text',
        required: true,
        placeholder: '1234567',
        helpText: 'מספר הטרמינל שקיבלת מפלאקארד',
      },
      {
        key: 'username',
        label: 'שם משתמש',
        type: 'text',
        required: true,
        placeholder: 'Username',
      },
      {
        key: 'password',
        label: 'סיסמה',
        type: 'password',
        required: true,
        placeholder: '••••••••',
      },
    ],
    supportedFeatures: [
      'credit_card',
      'tokenization',
      'refunds',
      'installments',
    ],
  },
  {
    id: 'payplus',
    name: 'פייפלוס',
    nameEn: 'PayPlus',
    description: 'סליקה ישראלית עם ממשק נוח ותמיכה ב-Bit',
    logo: '/images/providers/payplus.png',
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
        placeholder: 'API Key',
      },
      {
        key: 'secret_key',
        label: 'מפתח סודי',
        type: 'password',
        required: true,
        placeholder: 'Secret Key',
      },
      {
        key: 'terminal_uid',
        label: 'מזהה מסוף',
        type: 'text',
        required: true,
        placeholder: 'Terminal UID',
      },
    ],
    supportedFeatures: [
      'credit_card',
      'bit',
      'apple_pay',
      'google_pay',
      'tokenization',
      'refunds',
      'partial_refunds',
      'installments',
    ],
  },
  {
    id: 'hyp',
    name: 'הייפ',
    nameEn: 'Hyp',
    description: 'סליקה מהירה עם אפליקציית ניהול',
    logo: '/images/providers/hyp.png',
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
      {
        key: 'merchant_id',
        label: 'מזהה עסק',
        type: 'text',
        required: true,
      },
    ],
    supportedFeatures: [
      'credit_card',
      'bit',
      'refunds',
      'installments',
    ],
  },
  {
    id: 'meshulam',
    name: 'משולם / Grow',
    nameEn: 'Meshulam / Grow',
    description: 'סליקה פשוטה עם ממשק ידידותי',
    logo: '/images/providers/meshulam.png',
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
        placeholder: 'API Key',
      },
      {
        key: 'page_id',
        label: 'מזהה דף תשלום',
        type: 'text',
        required: true,
      },
    ],
    supportedFeatures: [
      'credit_card',
      'bit',
      'refunds',
      'installments',
    ],
  },
  {
    id: 'tranzila',
    name: 'טרנזילה',
    nameEn: 'Tranzila',
    description: 'סליקה ותיקה ויציבה',
    logo: '/images/providers/tranzila.png',
    requiredFields: [
      {
        key: 'terminal_name',
        label: 'שם טרמינל',
        type: 'text',
        required: true,
      },
      {
        key: 'terminal_password',
        label: 'סיסמת טרמינל',
        type: 'password',
        required: true,
      },
    ],
    supportedFeatures: [
      'credit_card',
      'tokenization',
      'refunds',
      'installments',
    ],
  },
  {
    id: 'cardcom',
    name: 'קארדקום',
    nameEn: 'Cardcom',
    description: 'סליקה מתקדמת עם מגוון אפשרויות',
    logo: '/images/providers/cardcom.png',
    requiredFields: [
      {
        key: 'terminal_number',
        label: 'מספר טרמינל',
        type: 'text',
        required: true,
      },
      {
        key: 'username',
        label: 'שם משתמש',
        type: 'text',
        required: true,
      },
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
    ],
    supportedFeatures: [
      'credit_card',
      'tokenization',
      'refunds',
      'partial_refunds',
      'installments',
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    nameEn: 'Stripe',
    description: 'סליקה בינלאומית - מומלץ למכירות לחו"ל',
    logo: '/images/providers/stripe.png',
    requiredFields: [
      {
        key: 'publishable_key',
        label: 'Publishable Key',
        type: 'text',
        required: true,
        placeholder: 'pk_...',
      },
      {
        key: 'secret_key',
        label: 'Secret Key',
        type: 'password',
        required: true,
        placeholder: 'sk_...',
      },
    ],
    supportedFeatures: [
      'credit_card',
      'apple_pay',
      'google_pay',
      'paypal',
      'tokenization',
      'recurring',
      'refunds',
      'partial_refunds',
    ],
  },
];

/**
 * Get provider config by ID
 */
export function getProviderConfig(providerId: PaymentProviderType): PaymentProviderConfig | undefined {
  return PAYMENT_PROVIDERS.find(p => p.id === providerId);
}

/**
 * Get all available providers (not coming soon)
 */
export function getAvailableProviders(): PaymentProviderConfig[] {
  return PAYMENT_PROVIDERS.filter(p => !p.isComingSoon);
}

/**
 * Get all providers including coming soon
 */
export function getAllProviders(): PaymentProviderConfig[] {
  return PAYMENT_PROVIDERS;
}

/**
 * Get recommended provider
 */
export function getRecommendedProvider(): PaymentProviderConfig | undefined {
  return PAYMENT_PROVIDERS.find(p => p.isRecommended);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(providerId: PaymentProviderType): string {
  const provider = getProviderConfig(providerId);
  return provider?.name || providerId;
}

/**
 * Get feature display name
 */
export function getFeatureDisplayName(feature: string): string {
  const features: Record<string, string> = {
    credit_card: 'כרטיס אשראי',
    bit: 'Bit',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
    paypal: 'PayPal',
    tokenization: 'שמירת כרטיס',
    recurring: 'תשלומים חוזרים',
    refunds: 'זיכויים',
    partial_refunds: 'זיכויים חלקיים',
    installments: 'תשלומים',
  };
  return features[feature] || feature;
}

