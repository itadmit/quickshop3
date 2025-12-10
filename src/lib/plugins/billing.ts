// Plugin Billing - ניהול בילינג לתוספים בתשלום

import { query, queryOne } from '@/lib/db';
import { PluginSubscription, Plugin } from '@/types/plugin';
import {
  createPluginRecurringPayment,
  cancelPluginRecurringPayment,
  updatePluginRecurringPayment,
  getPluginRecurringPaymentStatus,
} from './payment-provider';
import { getPluginBySlug } from './registry';

/**
 * רכישת תוסף בתשלום
 */
export async function subscribeToPlugin(
  storeId: number,
  pluginSlug: string,
  cardToken: string,
  paymentProviderSlug: string = 'quickshop_payments'
): Promise<{ success: boolean; subscriptionId?: number; error?: string }> {
  try {
    // בדיקה אם התוסף קיים
    const pluginDef = getPluginBySlug(pluginSlug);
    if (!pluginDef) {
      return { success: false, error: 'Plugin not found' };
    }

    // בדיקה אם התוסף בתשלום
    if (pluginDef.is_free) {
      return { success: false, error: 'Plugin is free, use install instead' };
    }

    // בדיקה אם כבר יש מנוי פעיל
    const existingSubscription = await queryOne<PluginSubscription>(
      `SELECT * FROM plugin_subscriptions 
       WHERE store_id = $1 AND plugin_id = (
         SELECT id FROM plugins WHERE slug = $2
       ) AND status = 'ACTIVE'`,
      [storeId, pluginSlug]
    );

    if (existingSubscription) {
      return { success: false, error: 'Subscription already exists' };
    }

    // קבלת התוסף מהמסד נתונים
    const plugin = await queryOne<Plugin>(
      `SELECT * FROM plugins WHERE slug = $1`,
      [pluginSlug]
    );

    if (!plugin) {
      return { success: false, error: 'Plugin not found in database' };
    }

    // יצירת הוראת קבע
    const recurringResult = await createPluginRecurringPayment(
      storeId,
      plugin.id,
      plugin.price!,
      cardToken,
      paymentProviderSlug
    );

    if (!recurringResult.success || !recurringResult.recurringPaymentUid) {
      return { success: false, error: recurringResult.error || 'Failed to create recurring payment' };
    }

    // חישוב תאריכים
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    const nextBillingDate = new Date(endDate);

    // יצירת מנוי במסד הנתונים
    const subscription = await queryOne<PluginSubscription>(
      `INSERT INTO plugin_subscriptions (
        store_id, plugin_id, status, is_active,
        start_date, end_date, next_billing_date,
        payment_method, recurring_payment_uid, card_token,
        monthly_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        storeId,
        plugin.id,
        'ACTIVE',
        true,
        startDate,
        endDate,
        nextBillingDate,
        paymentProviderSlug,
        recurringResult.recurringPaymentUid,
        cardToken,
        plugin.price!,
      ]
    );

    // עדכון התוסף להיות מותקן ופעיל
    await query(
      `UPDATE plugins 
       SET is_installed = true, is_active = true, installed_at = now()
       WHERE id = $1`,
      [plugin.id]
    );

    return { success: true, subscriptionId: subscription.id };
  } catch (error: any) {
    console.error('Error subscribing to plugin:', error);
    return { success: false, error: error.message || 'Failed to subscribe' };
  }
}

/**
 * ביטול מנוי לתוסף
 */
export async function cancelPluginSubscription(
  storeId: number,
  pluginSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // קבלת המנוי
    const subscription = await queryOne<PluginSubscription>(
      `SELECT ps.* FROM plugin_subscriptions ps
       JOIN plugins p ON p.id = ps.plugin_id
       WHERE ps.store_id = $1 AND p.slug = $2 AND ps.status = 'ACTIVE'`,
      [storeId, pluginSlug]
    );

    if (!subscription) {
      return { success: false, error: 'Active subscription not found' };
    }

    // ביטול הוראת הקבע
    if (subscription.recurring_payment_uid) {
      const cancelled = await cancelPluginRecurringPayment(
        subscription.recurring_payment_uid,
        subscription.payment_method || 'quickshop_payments'
      );

      if (!cancelled) {
        console.warn('Failed to cancel recurring payment, but continuing with DB update');
      }
    }

    // עדכון המנוי במסד הנתונים
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // נשאר פעיל עד סוף החודש

    await query(
      `UPDATE plugin_subscriptions 
       SET status = 'CANCELLED',
           cancelled_at = now(),
           end_date = $1,
           is_active = false
       WHERE id = $2`,
      [endDate, subscription.id]
    );

    // כיבוי התוסף בסוף החודש (או מיד אם רוצים)
    // כרגע נשאיר אותו פעיל עד סוף החודש
    // await query(
    //   `UPDATE plugins SET is_active = false WHERE id = $1`,
    //   [subscription.plugin_id]
    // );

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling plugin subscription:', error);
    return { success: false, error: error.message || 'Failed to cancel subscription' };
  }
}

/**
 * קבלת כל התוספים הפעילים לחנות
 */
export async function getStoreActivePlugins(storeId: number): Promise<PluginSubscription[]> {
  try {
    const subscriptions = await query<PluginSubscription>(
      `SELECT ps.* FROM plugin_subscriptions ps
       WHERE ps.store_id = $1 
       AND ps.status = 'ACTIVE'
       AND ps.is_active = true
       ORDER BY ps.created_at DESC`,
      [storeId]
    );

    return subscriptions;
  } catch (error) {
    console.error('Error getting store active plugins:', error);
    return [];
  }
}

/**
 * חישוב סכום כולל של כל התוספים הפעילים
 */
export async function calculateTotalPluginsPrice(storeId: number): Promise<number> {
  try {
    const result = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(monthly_price), 0) as total 
       FROM plugin_subscriptions
       WHERE store_id = $1 
       AND status = 'ACTIVE'
       AND is_active = true`,
      [storeId]
    );

    return parseFloat(result?.total || '0');
  } catch (error) {
    console.error('Error calculating total plugins price:', error);
    return 0;
  }
}

/**
 * עדכון סטטוס מנוי לאחר תשלום (מ-webhook)
 */
export async function updateSubscriptionAfterPayment(
  subscriptionId: number,
  paymentAmount: number
): Promise<boolean> {
  try {
    const subscription = await queryOne<PluginSubscription>(
      `SELECT * FROM plugin_subscriptions WHERE id = $1`,
      [subscriptionId]
    );

    if (!subscription) {
      return false;
    }

    // חישוב תאריך חיוב הבא
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // עדכון המנוי
    await query(
      `UPDATE plugin_subscriptions 
       SET last_payment_date = now(),
           last_payment_amount = $1,
           next_billing_date = $2,
           status = 'ACTIVE',
           is_active = true
       WHERE id = $3`,
      [paymentAmount, nextBillingDate, subscriptionId]
    );

    // עדכון תאריך סיום
    const endDate = new Date(nextBillingDate);
    await query(
      `UPDATE plugin_subscriptions 
       SET end_date = $1
       WHERE id = $2`,
      [endDate, subscriptionId]
    );

    return true;
  } catch (error) {
    console.error('Error updating subscription after payment:', error);
    return false;
  }
}

/**
 * בדיקה אם מנוי פג תוקף וכיבוי אוטומטי
 */
export async function checkAndDeactivateExpiredSubscriptions(): Promise<void> {
  try {
    const expiredSubscriptions = await query<PluginSubscription>(
      `SELECT * FROM plugin_subscriptions 
       WHERE status = 'ACTIVE' 
       AND end_date < now()`,
      []
    );

    for (const subscription of expiredSubscriptions) {
      await query(
        `UPDATE plugin_subscriptions 
         SET status = 'EXPIRED', is_active = false
         WHERE id = $1`,
        [subscription.id]
      );

      await query(
        `UPDATE plugins 
         SET is_active = false
         WHERE id = $1`,
        [subscription.plugin_id]
      );
    }
  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
  }
}

