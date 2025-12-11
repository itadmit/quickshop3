// Payment Provider Interface - Generic payment system for plugins
// Ready for QuickShop Payments integration

import { 
  PaymentProvider, 
  CreateRecurringPaymentParams, 
  RecurringPaymentResult,
  UpdateRecurringPaymentParams,
  RecurringPaymentStatus
} from '@/types/plugin';

/**
 * Generic Payment Provider Interface
 * כל ספק תשלום צריך לממש את הממשק הזה
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  abstract name: string;
  abstract slug: string;

  abstract createRecurringPayment(
    params: CreateRecurringPaymentParams
  ): Promise<RecurringPaymentResult>;

  abstract cancelRecurringPayment(
    recurringPaymentUid: string
  ): Promise<boolean>;

  abstract updateRecurringPayment(
    recurringPaymentUid: string,
    params: UpdateRecurringPaymentParams
  ): Promise<boolean>;

  abstract getRecurringPaymentStatus(
    recurringPaymentUid: string
  ): Promise<RecurringPaymentStatus>;
}

/**
 * QuickShop Payments Provider (לעתיד)
 * זה יהיה הספק הראשי שלנו
 */
export class QuickShopPaymentsProvider extends BasePaymentProvider {
  name = 'QuickShop Payments';
  slug = 'quickshop_payments';

  async createRecurringPayment(
    params: CreateRecurringPaymentParams
  ): Promise<RecurringPaymentResult> {
    // TODO: יישום אינטגרציה עם QuickShop Payments
    // כרגע מחזיר mock
    throw new Error('QuickShop Payments integration coming soon');
  }

  async cancelRecurringPayment(
    recurringPaymentUid: string
  ): Promise<boolean> {
    // TODO: יישום ביטול הוראת קבע
    throw new Error('QuickShop Payments integration coming soon');
  }

  async updateRecurringPayment(
    recurringPaymentUid: string,
    params: UpdateRecurringPaymentParams
  ): Promise<boolean> {
    // TODO: יישום עדכון הוראת קבע
    throw new Error('QuickShop Payments integration coming soon');
  }

  async getRecurringPaymentStatus(
    recurringPaymentUid: string
  ): Promise<RecurringPaymentStatus> {
    // TODO: יישום בדיקת סטטוס
    throw new Error('QuickShop Payments integration coming soon');
  }
}

/**
 * Payment Provider Factory
 * מחזיר את הספק הנכון לפי store_id או הגדרות
 */
export class PaymentProviderFactory {
  private static providers: Map<string, BasePaymentProvider> = new Map();

  static registerProvider(provider: BasePaymentProvider): void {
    this.providers.set(provider.slug, provider);
  }

  static getProvider(providerSlug: string = 'quickshop_payments'): BasePaymentProvider {
    const provider = this.providers.get(providerSlug);
    if (!provider) {
      throw new Error(`Payment provider ${providerSlug} not found`);
    }
    return provider;
  }

  static getDefaultProvider(): BasePaymentProvider {
    // כרגע מחזיר QuickShop Payments (לאחר יישום)
    // או mock provider לבדיקות
    return this.getProvider('quickshop_payments');
  }
}

// רישום הספקים
PaymentProviderFactory.registerProvider(new QuickShopPaymentsProvider());

// Export helper functions
export async function createPluginRecurringPayment(
  storeId: number,
  pluginId: number,
  amount: number,
  cardToken: string,
  paymentProviderSlug: string = 'quickshop_payments'
): Promise<RecurringPaymentResult> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  
  return provider.createRecurringPayment({
    storeId,
    pluginId,
    amount,
    currency: 'ILS',
    cardToken,
    description: `Plugin subscription`,
  });
}

export async function cancelPluginRecurringPayment(
  recurringPaymentUid: string,
  paymentProviderSlug: string = 'quickshop_payments'
): Promise<boolean> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  return provider.cancelRecurringPayment(recurringPaymentUid);
}

export async function updatePluginRecurringPayment(
  recurringPaymentUid: string,
  params: UpdateRecurringPaymentParams,
  paymentProviderSlug: string = 'quickshop_payments'
): Promise<boolean> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  return provider.updateRecurringPayment(recurringPaymentUid, params);
}

export async function getPluginRecurringPaymentStatus(
  recurringPaymentUid: string,
  paymentProviderSlug: string = 'quickshop_payments'
): Promise<RecurringPaymentStatus> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  return provider.getRecurringPaymentStatus(recurringPaymentUid);
}



