import { ShippingProviderType } from '@/types/payment';

/**
 * Shipping Provider Field Configuration
 */
export interface ShippingProviderField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

/**
 * Shipping Provider Configuration
 */
export interface ShippingProviderConfig {
  id: ShippingProviderType;
  name: string;
  nameEn: string;
  description: string;
  logo: string;
  isRecommended?: boolean;
  isComingSoon?: boolean;
  requiredFields: ShippingProviderField[];
  supportedFeatures: string[];
  baseUrl?: string;
  sandboxUrl?: string;
}

/**
 * Shipping Providers Configuration
 * 
 * כל ספקי המשלוחים הנתמכים במערכת.
 * ניתן להוסיף ספקים נוספים על ידי הוספה למערך הזה.
 */
export const SHIPPING_PROVIDERS: ShippingProviderConfig[] = [
  {
    id: 'baldar',
    name: 'בלדר / פוקוס משלוחים',
    nameEn: 'Baldar / Focus Delivery',
    description: 'שליחויות ברחבי הארץ עם מעקב בזמן אמת, איסוף מנקודות חלוקה',
    logo: '/images/providers/baldar.png',
    isRecommended: true,
    requiredFields: [
      {
        key: 'customer_number',
        label: 'מספר לקוח',
        type: 'text',
        required: true,
        placeholder: '12345',
        helpText: 'מספר הלקוח שלך בבלדר/פוקוס',
      },
      {
        key: 'api_base_url',
        label: 'כתובת API',
        type: 'text',
        required: false,
        placeholder: 'https://focusdelivery.co.il',
        helpText: 'השאר ריק לשימוש בכתובת ברירת מחדל',
      },
      {
        key: 'shipment_type_code',
        label: 'קוד סוג משלוח',
        type: 'text',
        required: false,
        placeholder: '1',
        helpText: 'קוד סוג המשלוח (לפי הסכם)',
      },
      {
        key: 'cargo_type_code',
        label: 'קוד סוג מטען',
        type: 'text',
        required: false,
        placeholder: '1',
        helpText: 'קוד סוג המטען (לפי הסכם)',
      },
      {
        key: 'reference_prefix',
        label: 'תחילית לאסמכתא',
        type: 'text',
        required: false,
        placeholder: 'QS-',
        helpText: 'תחילית למספר הזמנה (אופציונלי)',
      },
    ],
    supportedFeatures: [
      'tracking',
      'pickup_points',
      'label_printing',
      'cancellation',
      'same_day',
      'returns',
    ],
    baseUrl: 'https://focusdelivery.co.il',
  },
  {
    id: 'cargo',
    name: 'קארגו שליחויות',
    nameEn: 'Cargo',
    description: 'שירות שליחויות ארצי מהיר ואמין',
    logo: '/images/providers/cargo.png',
    isComingSoon: true,
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
      {
        key: 'customer_id',
        label: 'מזהה לקוח',
        type: 'text',
        required: true,
      },
    ],
    supportedFeatures: [
      'tracking',
      'label_printing',
      'cancellation',
    ],
  },
  {
    id: 'lionwheel',
    name: 'ליון וויל',
    nameEn: 'Lionwheel',
    description: 'פתרון משלוחים משולב עם מגוון ספקים',
    logo: '/images/providers/lionwheel.png',
    isComingSoon: true,
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
      {
        key: 'store_id',
        label: 'מזהה חנות',
        type: 'text',
        required: true,
      },
    ],
    supportedFeatures: [
      'tracking',
      'pickup_points',
      'label_printing',
      'multi_carrier',
    ],
  },
  {
    id: 'chita',
    name: 'צ\'יטה',
    nameEn: 'Chita',
    description: 'משלוחים מהירים ביום העסקים',
    logo: '/images/providers/chita.png',
    isComingSoon: true,
    requiredFields: [
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
      {
        key: 'branch_id',
        label: 'מזהה סניף',
        type: 'text',
        required: true,
      },
    ],
    supportedFeatures: [
      'tracking',
      'same_day',
      'express',
    ],
  },
  {
    id: 'dhl',
    name: 'DHL',
    nameEn: 'DHL',
    description: 'משלוחים בינלאומיים מהמובילים בעולם',
    logo: '/images/providers/dhl.png',
    isComingSoon: true,
    requiredFields: [
      {
        key: 'account_number',
        label: 'מספר חשבון',
        type: 'text',
        required: true,
      },
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
      {
        key: 'api_secret',
        label: 'מפתח סודי',
        type: 'password',
        required: true,
      },
    ],
    supportedFeatures: [
      'tracking',
      'international',
      'label_printing',
      'customs',
    ],
  },
  {
    id: 'fedex',
    name: 'FedEx',
    nameEn: 'FedEx',
    description: 'משלוחים בינלאומיים מהירים',
    logo: '/images/providers/fedex.png',
    isComingSoon: true,
    requiredFields: [
      {
        key: 'account_number',
        label: 'מספר חשבון',
        type: 'text',
        required: true,
      },
      {
        key: 'api_key',
        label: 'מפתח API',
        type: 'password',
        required: true,
      },
      {
        key: 'api_secret',
        label: 'מפתח סודי',
        type: 'password',
        required: true,
      },
    ],
    supportedFeatures: [
      'tracking',
      'international',
      'label_printing',
      'express',
    ],
  },
];

/**
 * Get provider config by ID
 */
export function getShippingProviderConfig(providerId: ShippingProviderType): ShippingProviderConfig | undefined {
  return SHIPPING_PROVIDERS.find(p => p.id === providerId);
}

/**
 * Get all available providers (not coming soon)
 */
export function getAvailableShippingProviders(): ShippingProviderConfig[] {
  return SHIPPING_PROVIDERS.filter(p => !p.isComingSoon);
}

/**
 * Get all providers including coming soon
 */
export function getAllShippingProviders(): ShippingProviderConfig[] {
  return SHIPPING_PROVIDERS;
}

/**
 * Get recommended provider
 */
export function getRecommendedShippingProvider(): ShippingProviderConfig | undefined {
  return SHIPPING_PROVIDERS.find(p => p.isRecommended);
}

/**
 * Get provider display name
 */
export function getShippingProviderDisplayName(providerId: ShippingProviderType): string {
  const provider = getShippingProviderConfig(providerId);
  return provider?.name || providerId;
}

/**
 * Get feature display name
 */
export function getShippingFeatureDisplayName(feature: string): string {
  const features: Record<string, string> = {
    tracking: 'מעקב משלוחים',
    pickup_points: 'נקודות איסוף',
    label_printing: 'הדפסת מדבקות',
    cancellation: 'ביטול משלוחים',
    same_day: 'משלוח באותו יום',
    express: 'משלוח אקספרס',
    returns: 'החזרות',
    international: 'משלוחים בינלאומיים',
    customs: 'טיפול מכס',
    multi_carrier: 'ריבוי ספקים',
  };
  return features[feature] || feature;
}

