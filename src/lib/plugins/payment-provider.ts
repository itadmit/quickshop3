// Payment Provider Interface - Generic payment system for plugins
// Using PayPlus for recurring payments

import { 
  PaymentProvider, 
  CreateRecurringPaymentParams, 
  RecurringPaymentResult,
  UpdateRecurringPaymentParams,
  RecurringPaymentStatus
} from '@/types/plugin';
import { getPayPlusClient } from '@/lib/payplus';
import { query, queryOne } from '@/lib/db';

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
 * PayPlus Provider - הספק הראשי לתשלומים חוזרים
 * 
 * איך זה עובד (בדומה לשופיפיי):
 * 1. כשמשתמש רוכש תוסף - מייצרים לינק תשלום עם create_token=true
 * 2. אחרי תשלום מוצלח - שומרים את ה-token
 * 3. כל חודש ה-cron מחייב מה-token
 * 4. IPN מעדכן את הסטטוס
 */
export class PayPlusPluginProvider extends BasePaymentProvider {
  name = 'PayPlus Plugins';
  slug = 'payplus_plugins';

  /**
   * יצירת לינק תשלום ראשון לתוסף
   * לאחר התשלום נקבל token לחיובים עתידיים
   */
  async createRecurringPayment(
    params: CreateRecurringPaymentParams
  ): Promise<RecurringPaymentResult> {
    try {
      const payplus = getPayPlusClient();
      
      // קבלת פרטי החנות
      const store = await queryOne<{ name: string; owner_email: string }>(
        `SELECT s.name, so.email as owner_email
         FROM stores s
         JOIN store_owners so ON s.owner_id = so.id
         WHERE s.id = $1`,
        [params.storeId]
      );
      
      if (!store) {
        return { success: false, error: 'Store not found' };
      }
      
      // קבלת פרטי התוסף
      const plugin = await queryOne<{ name: string; price: number }>(
        `SELECT name, price FROM plugins WHERE id = $1`,
        [params.pluginId]
      );
      
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }
      
      // חישוב מחיר עם מע"מ
      const vatAmount = Math.round(params.amount * 0.17 * 100) / 100;
      const totalAmount = Math.round((params.amount + vatAmount) * 100) / 100;
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickshop.co.il';
      
      // יצירת לינק תשלום
      const result = await payplus.generatePaymentLink({
        amount: totalAmount,
        currency_code: params.currency || 'ILS',
        create_token: true, // חשוב! לשמירת token לחיובים עתידיים
        customer: {
          customer_name: store.name,
          email: store.owner_email,
        },
        items: [{
          name: `תוסף: ${plugin.name}`,
          quantity: 1,
          price: totalAmount,
          vat_type: 0,
        }],
        more_info: params.storeId.toString(),
        more_info_2: `plugin_${params.pluginId}`,
        more_info_3: 'plugin_subscription',
        refURL_success: `${baseUrl}/settings/plugins?success=1&plugin=${params.pluginId}`,
        refURL_failure: `${baseUrl}/settings/plugins?error=1&plugin=${params.pluginId}`,
        refURL_cancel: `${baseUrl}/settings/plugins?cancelled=1&plugin=${params.pluginId}`,
        refURL_callback: `${baseUrl}/api/plugins/ipn`,
        send_failure_callback: true,
        sendEmailApproval: true,
      });
      
      return {
        success: true,
        recurringPaymentUid: result.data.page_request_uid,
        paymentDetails: {
          paymentUrl: result.data.payment_page_link,
          qrCode: result.data.qr_code_image,
        },
      };
    } catch (error: any) {
      console.error('[PayPlus Plugin] Create recurring payment error:', error);
      return { success: false, error: error.message || 'Payment creation failed' };
    }
  }

  /**
   * חיוב חודשי מטוקן שמור
   */
  async chargeFromToken(
    storeId: number,
    pluginId: number,
    tokenUid: string,
    amount: number,
    customerUid?: string
  ): Promise<{ success: boolean; transactionUid?: string; error?: string }> {
    try {
      const payplus = getPayPlusClient();
      
      // קבלת פרטי התוסף
      const plugin = await queryOne<{ name: string }>(
        `SELECT name FROM plugins WHERE id = $1`,
        [pluginId]
      );
      
      // חישוב מחיר עם מע"מ
      const vatAmount = Math.round(amount * 0.17 * 100) / 100;
      const totalAmount = Math.round((amount + vatAmount) * 100) / 100;
      
      const result = await payplus.chargeFromToken({
        amount: totalAmount,
        token: tokenUid,
        customer_uid: customerUid,
        more_info: storeId.toString(),
        more_info_2: `plugin_renewal_${pluginId}`,
        products: [{
          name: `חידוש תוסף: ${plugin?.name || 'תוסף'}`,
          quantity: 1,
          price: totalAmount,
        }],
        initial_invoice: true,
      });
      
      return {
        success: true,
        transactionUid: result.data.transaction_uid,
      };
    } catch (error: any) {
      console.error('[PayPlus Plugin] Charge from token error:', error);
      return { success: false, error: error.message || 'Charge failed' };
    }
  }

  /**
   * ביטול מנוי - מסמן את המנוי כמבוטל
   * החנות תמשיך להשתמש עד סוף התקופה ששולמה
   */
  async cancelRecurringPayment(
    recurringPaymentUid: string
  ): Promise<boolean> {
    try {
      // מעדכנים את המנוי במסד שהוא מבוטל
      // לא צריך לפנות ל-PayPlus כי אנחנו לא משתמשים בהוראת קבע שלהם
      // אנחנו מחייבים ידנית מה-token
      
      await query(
        `UPDATE plugin_subscriptions 
         SET status = 'CANCELLED',
             cancelled_at = now(),
             is_active = false
         WHERE recurring_payment_uid = $1`,
        [recurringPaymentUid]
      );
      
      return true;
    } catch (error) {
      console.error('[PayPlus Plugin] Cancel recurring error:', error);
      return false;
    }
  }

  /**
   * עדכון פרטי מנוי
   */
  async updateRecurringPayment(
    recurringPaymentUid: string,
    params: UpdateRecurringPaymentParams
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (params.amount !== undefined) {
        updates.push(`monthly_price = $${paramIndex++}`);
        values.push(params.amount);
      }
      
      if (params.cardToken !== undefined) {
        updates.push(`card_token = $${paramIndex++}`);
        values.push(params.cardToken);
      }
      
      if (params.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(params.isActive);
      }
      
      if (updates.length === 0) {
        return true;
      }
      
      values.push(recurringPaymentUid);
      
      await query(
        `UPDATE plugin_subscriptions 
         SET ${updates.join(', ')}, updated_at = now()
         WHERE recurring_payment_uid = $${paramIndex}`,
        values
      );
      
      return true;
    } catch (error) {
      console.error('[PayPlus Plugin] Update recurring error:', error);
      return false;
    }
  }

  /**
   * קבלת סטטוס מנוי
   */
  async getRecurringPaymentStatus(
    recurringPaymentUid: string
  ): Promise<RecurringPaymentStatus> {
    try {
      const subscription = await queryOne<{
        status: string;
        next_billing_date: Date | null;
        last_payment_date: Date | null;
        last_payment_amount: number | null;
      }>(
        `SELECT status, next_billing_date, last_payment_date, last_payment_amount
         FROM plugin_subscriptions
         WHERE recurring_payment_uid = $1`,
        [recurringPaymentUid]
      );
      
      if (!subscription) {
        return {
          isActive: false,
          nextBillingDate: null,
          lastPaymentDate: null,
          lastPaymentAmount: null,
          status: 'expired',
        };
      }
      
      return {
        isActive: subscription.status === 'ACTIVE',
        nextBillingDate: subscription.next_billing_date,
        lastPaymentDate: subscription.last_payment_date,
        lastPaymentAmount: subscription.last_payment_amount,
        status: subscription.status.toLowerCase() as any,
      };
    } catch (error) {
      console.error('[PayPlus Plugin] Get status error:', error);
      return {
        isActive: false,
        nextBillingDate: null,
        lastPaymentDate: null,
        lastPaymentAmount: null,
        status: 'failed',
      };
    }
  }
}

/**
 * Payment Provider Factory
 * מחזיר את הספק הנכון לפי slug
 */
export class PaymentProviderFactory {
  private static providers: Map<string, BasePaymentProvider> = new Map();

  static registerProvider(provider: BasePaymentProvider): void {
    this.providers.set(provider.slug, provider);
  }

  static getProvider(providerSlug: string = 'payplus_plugins'): BasePaymentProvider {
    const provider = this.providers.get(providerSlug);
    if (!provider) {
      // ברירת מחדל - PayPlus
      return this.providers.get('payplus_plugins')!;
    }
    return provider;
  }

  static getDefaultProvider(): BasePaymentProvider {
    return this.getProvider('payplus_plugins');
  }
  
  static getPayPlusProvider(): PayPlusPluginProvider {
    return this.providers.get('payplus_plugins') as PayPlusPluginProvider;
  }
}

// רישום הספקים
PaymentProviderFactory.registerProvider(new PayPlusPluginProvider());

// Export helper functions
export async function createPluginRecurringPayment(
  storeId: number,
  pluginId: number,
  amount: number,
  cardToken: string,
  paymentProviderSlug: string = 'payplus_plugins'
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
  paymentProviderSlug: string = 'payplus_plugins'
): Promise<boolean> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  return provider.cancelRecurringPayment(recurringPaymentUid);
}

export async function updatePluginRecurringPayment(
  recurringPaymentUid: string,
  params: UpdateRecurringPaymentParams,
  paymentProviderSlug: string = 'payplus_plugins'
): Promise<boolean> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  return provider.updateRecurringPayment(recurringPaymentUid, params);
}

export async function getPluginRecurringPaymentStatus(
  recurringPaymentUid: string,
  paymentProviderSlug: string = 'payplus_plugins'
): Promise<RecurringPaymentStatus> {
  const provider = PaymentProviderFactory.getProvider(paymentProviderSlug);
  return provider.getRecurringPaymentStatus(recurringPaymentUid);
}

/**
 * חיוב חודשי של תוסף מטוקן שמור
 */
export async function chargePluginFromToken(
  storeId: number,
  pluginId: number,
  tokenUid: string,
  amount: number,
  customerUid?: string
): Promise<{ success: boolean; transactionUid?: string; error?: string }> {
  const provider = PaymentProviderFactory.getPayPlusProvider();
  return provider.chargeFromToken(storeId, pluginId, tokenUid, amount, customerUid);
}
