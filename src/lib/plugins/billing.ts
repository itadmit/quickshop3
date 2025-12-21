// Plugin Billing - ניהול בילינג לתוספים בתשלום
// משתמש בטוקן הקיים של החנות (מהמנוי הראשי)

import { query, queryOne } from '@/lib/db';
import { PluginSubscription, Plugin } from '@/types/plugin';
import { getPayPlusClient } from '@/lib/payplus';
import { getPluginBySlug } from './registry';

interface StorePaymentToken {
  id: number;
  payplus_token_uid: string;
  payplus_customer_uid: string | null;
  four_digits: string | null;
  brand: string | null;
}

interface StoreSubscription {
  status: string;
  plan_id: number;
}

/**
 * בדיקה האם לחנות יש טוקן תקף לחיוב
 */
export async function getStorePrimaryToken(storeId: number): Promise<StorePaymentToken | null> {
  return queryOne<StorePaymentToken>(
    `SELECT id, payplus_token_uid, payplus_customer_uid, four_digits, brand
     FROM qs_payment_tokens 
     WHERE store_id = $1 AND is_primary = true AND is_active = true`,
    [storeId]
  );
}

/**
 * בדיקה האם החנות משלמת (לא בניסיון ולא חסומה)
 */
export async function isStorePayingSubscriber(storeId: number): Promise<boolean> {
  const subscription = await queryOne<StoreSubscription>(
    `SELECT status, plan_id FROM qs_store_subscriptions WHERE store_id = $1`,
    [storeId]
  );
  
  return subscription?.status === 'active';
}

/**
 * התקנת תוסף בתשלום
 * מחייב מיד מהטוקן הקיים של החנות
 */
export async function subscribeToPlugin(
  storeId: number,
  pluginSlug: string
): Promise<{ 
  success: boolean; 
  subscriptionId?: number; 
  error?: string;
  errorCode?: 'NO_TOKEN' | 'NOT_PAYING' | 'CHARGE_FAILED' | 'PLUGIN_NOT_FOUND' | 'ALREADY_SUBSCRIBED';
}> {
  try {
    // בדיקה אם התוסף קיים
    const pluginDef = getPluginBySlug(pluginSlug);
    if (!pluginDef) {
      return { success: false, error: 'התוסף לא נמצא', errorCode: 'PLUGIN_NOT_FOUND' };
    }

    // אם התוסף חינמי - פשוט מתקינים
    if (pluginDef.is_free) {
      return await installFreePlugin(storeId, pluginSlug);
    }

    // בדיקה אם החנות משלמת
    const isPaying = await isStorePayingSubscriber(storeId);
    if (!isPaying) {
      return { 
        success: false, 
        error: 'יש להפעיל מנוי בתשלום לפני רכישת תוספים',
        errorCode: 'NOT_PAYING' 
      };
    }

    // בדיקה אם יש טוקן תקף
    const token = await getStorePrimaryToken(storeId);
    if (!token) {
      return { 
        success: false, 
        error: 'לא נמצא אמצעי תשלום. יש לעדכן את פרטי הכרטיס בהגדרות הבילינג',
        errorCode: 'NO_TOKEN' 
      };
    }

    // בדיקה אם כבר יש מנוי פעיל
    const existingSubscription = await queryOne<PluginSubscription>(
      `SELECT * FROM plugin_subscriptions 
       WHERE store_id = $1 AND plugin_id = (
         SELECT id FROM plugins WHERE slug = $2 LIMIT 1
       ) AND status = 'ACTIVE'`,
      [storeId, pluginSlug]
    );

    if (existingSubscription) {
      return { success: false, error: 'כבר יש מנוי פעיל לתוסף זה', errorCode: 'ALREADY_SUBSCRIBED' };
    }

    // קבלת/יצירת התוסף במסד הנתונים
    let plugin = await queryOne<Plugin>(
      `SELECT * FROM plugins WHERE slug = $1 AND (store_id = $2 OR store_id IS NULL) LIMIT 1`,
      [pluginSlug, storeId]
    );

    if (!plugin) {
      // יצירת רשומת תוסף לחנות
      plugin = await queryOne<Plugin>(
        `INSERT INTO plugins (
          store_id, name, slug, description, version, type, category,
          is_built_in, is_free, price, currency, is_installed, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, false)
        RETURNING *`,
        [
          storeId,
          pluginDef.name,
          pluginDef.slug,
          pluginDef.description,
          pluginDef.version,
          pluginDef.type,
          pluginDef.category,
          pluginDef.is_built_in,
          pluginDef.is_free,
          pluginDef.price,
          pluginDef.currency || 'ILS',
        ]
      );
    }

    // חישוב מחיר עם מע"מ
    const price = pluginDef.price || 0;
    const vatAmount = Math.round(price * 0.17 * 100) / 100;
    const totalAmount = Math.round((price + vatAmount) * 100) / 100;

    // חיוב מיידי מהטוקן
    const payplus = getPayPlusClient();
    
    try {
      const chargeResult = await payplus.chargeFromToken({
        amount: totalAmount,
        token: token.payplus_token_uid,
        customer_uid: token.payplus_customer_uid || undefined,
        more_info: storeId.toString(),
        more_info_2: `plugin_${plugin!.id}`,
        products: [{
          name: `תוסף: ${pluginDef.name}`,
          quantity: 1,
          price: totalAmount,
        }],
        initial_invoice: true,
      });

      // חישוב תאריכים
      const now = new Date();
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      const endDate = new Date(nextBillingDate);

      // יצירת מנוי
      const subscription = await queryOne<PluginSubscription>(
        `INSERT INTO plugin_subscriptions (
          store_id, plugin_id, status, is_active,
          start_date, end_date, next_billing_date,
          payment_method, card_token,
          monthly_price, last_payment_date, last_payment_amount
        ) VALUES ($1, $2, 'ACTIVE', true, $3, $4, $5, 'payplus', $6, $7, $3, $8)
        RETURNING *`,
        [
          storeId,
          plugin!.id,
          now,
          endDate,
          nextBillingDate,
          token.payplus_token_uid,
          price,
          totalAmount,
        ]
      );

      // עדכון התוסף להיות מותקן ופעיל
      await query(
        `UPDATE plugins 
         SET is_installed = true, is_active = true, installed_at = now()
         WHERE id = $1`,
        [plugin!.id]
      );

      // רישום העסקה
      await query(`
        INSERT INTO qs_billing_transactions (
          store_id, subscription_id, type, amount, vat_amount, total_amount,
          status, payplus_transaction_uid, payplus_approval_num,
          description, processed_at
        ) VALUES ($1, $2, 'plugin', $3, $4, $5, 'success', $6, $7, $8, now())
      `, [
        storeId,
        subscription!.id,
        price,
        vatAmount,
        totalAmount,
        chargeResult.data.transaction_uid,
        chargeResult.data.approval_num,
        `רכישת תוסף: ${pluginDef.name}`,
      ]);

      // עדכון שימוש אחרון בטוקן
      await query(
        `UPDATE qs_payment_tokens SET last_used_at = now() WHERE id = $1`,
        [token.id]
      );

      return { success: true, subscriptionId: subscription!.id };

    } catch (chargeError: any) {
      console.error('[Plugin Billing] Charge failed:', chargeError);
      
      // רישום עסקה שנכשלה
      await query(`
        INSERT INTO qs_billing_transactions (
          store_id, type, amount, total_amount,
          status, description, failure_reason
        ) VALUES ($1, 'plugin', $2, $3, 'failed', $4, $5)
      `, [
        storeId,
        price,
        totalAmount,
        `רכישת תוסף: ${pluginDef.name} - נכשל`,
        chargeError.message || 'Unknown error',
      ]);

      return { 
        success: false, 
        error: 'החיוב נכשל. יש לעדכן את פרטי הכרטיס בהגדרות הבילינג',
        errorCode: 'CHARGE_FAILED' 
      };
    }

  } catch (error: any) {
    console.error('[Plugin Billing] Error subscribing to plugin:', error);
    return { success: false, error: error.message || 'שגיאה בהתקנת התוסף' };
  }
}

/**
 * התקנת תוסף חינמי
 */
async function installFreePlugin(
  storeId: number,
  pluginSlug: string
): Promise<{ success: boolean; subscriptionId?: number; error?: string }> {
  const pluginDef = getPluginBySlug(pluginSlug);
  if (!pluginDef) {
    return { success: false, error: 'התוסף לא נמצא' };
  }

  // יצירת/עדכון התוסף
  const plugin = await queryOne<Plugin>(
    `INSERT INTO plugins (
      store_id, name, slug, description, version, type, category,
      is_built_in, is_free, is_installed, is_active, installed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, true, now())
    ON CONFLICT (store_id, slug) DO UPDATE SET
      is_installed = true,
      is_active = true,
      updated_at = now()
    RETURNING *`,
    [
      storeId,
      pluginDef.name,
      pluginDef.slug,
      pluginDef.description,
      pluginDef.version,
      pluginDef.type,
      pluginDef.category,
      pluginDef.is_built_in,
    ]
  );

  return { success: true, subscriptionId: plugin?.id };
}

/**
 * ביטול מנוי לתוסף
 * התוסף ימשיך לעבוד עד סוף התקופה ששולמה
 */
export async function cancelPluginSubscription(
  storeId: number,
  pluginSlug: string
): Promise<{ success: boolean; endDate?: Date; error?: string }> {
  try {
    // קבלת המנוי
    const subscription = await queryOne<PluginSubscription & { end_date: Date }>(
      `SELECT ps.* FROM plugin_subscriptions ps
       JOIN plugins p ON p.id = ps.plugin_id
       WHERE ps.store_id = $1 AND p.slug = $2 AND ps.status = 'ACTIVE'`,
      [storeId, pluginSlug]
    );

    if (!subscription) {
      return { success: false, error: 'לא נמצא מנוי פעיל לתוסף זה' };
    }

    // עדכון המנוי - מסמנים כמבוטל אבל נשאר פעיל עד end_date
    await query(
      `UPDATE plugin_subscriptions 
       SET status = 'CANCELLED',
           cancelled_at = now()
       WHERE id = $1`,
      [subscription.id]
    );

    // is_active נשאר true עד שה-cron יכבה אחרי end_date

    return { 
      success: true, 
      endDate: subscription.end_date 
    };
  } catch (error: any) {
    console.error('[Plugin Billing] Error cancelling subscription:', error);
    return { success: false, error: error.message || 'שגיאה בביטול המנוי' };
  }
}

/**
 * הסרת תוסף (ביטול + כיבוי מיידי)
 */
export async function uninstallPlugin(
  storeId: number,
  pluginSlug: string
): Promise<{ success: boolean; endDate?: Date; error?: string }> {
  try {
    // ביטול המנוי קודם
    const cancelResult = await cancelPluginSubscription(storeId, pluginSlug);
    
    // התוסף ימשיך לעבוד עד סוף התקופה (כי כבר שילמו)
    // רק אם רוצים להסיר מיידית בלי החזר - אפשר להוסיף פרמטר
    
    return cancelResult;
  } catch (error: any) {
    console.error('[Plugin Billing] Error uninstalling plugin:', error);
    return { success: false, error: error.message || 'שגיאה בהסרת התוסף' };
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
       AND ps.is_active = true
       ORDER BY ps.created_at DESC`,
      [storeId]
    );

    return subscriptions;
  } catch (error) {
    console.error('[Plugin Billing] Error getting store active plugins:', error);
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
    console.error('[Plugin Billing] Error calculating total plugins price:', error);
    return 0;
  }
}

/**
 * חיוב חודשי של כל התוספים הפעילים לחנות
 * נקרא מה-cron
 */
export async function chargeStorePlugins(
  storeId: number,
  tokenUid: string,
  customerUid?: string
): Promise<{ 
  success: boolean; 
  charged: number; 
  failed: number; 
  totalAmount: number;
  errors: string[];
}> {
  const results = {
    success: true,
    charged: 0,
    failed: 0,
    totalAmount: 0,
    errors: [] as string[],
  };

  try {
    // קבלת כל המנויים שצריך לחייב היום
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSubscriptions = await query<{
      id: number;
      plugin_id: number;
      plugin_name: string;
      monthly_price: number;
    }>(
      `SELECT ps.id, ps.plugin_id, p.name as plugin_name, ps.monthly_price
       FROM plugin_subscriptions ps
       JOIN plugins p ON p.id = ps.plugin_id
       WHERE ps.store_id = $1 
       AND ps.status = 'ACTIVE'
       AND ps.is_active = true
       AND ps.next_billing_date <= $2`,
      [storeId, today]
    );

    if (dueSubscriptions.length === 0) {
      return results;
    }

    const payplus = getPayPlusClient();

    for (const sub of dueSubscriptions) {
      try {
        const vatAmount = Math.round(sub.monthly_price * 0.17 * 100) / 100;
        const totalAmount = Math.round((sub.monthly_price + vatAmount) * 100) / 100;

        const chargeResult = await payplus.chargeFromToken({
          amount: totalAmount,
          token: tokenUid,
          customer_uid: customerUid,
          more_info: storeId.toString(),
          more_info_2: `plugin_renewal_${sub.plugin_id}`,
          products: [{
            name: `חידוש תוסף: ${sub.plugin_name}`,
            quantity: 1,
            price: totalAmount,
          }],
          initial_invoice: true,
        });

        // עדכון המנוי
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        const endDate = new Date(nextBillingDate);

        await query(
          `UPDATE plugin_subscriptions
           SET end_date = $1,
               next_billing_date = $2,
               last_payment_date = now(),
               last_payment_amount = $3,
               updated_at = now()
           WHERE id = $4`,
          [endDate, nextBillingDate, totalAmount, sub.id]
        );

        // רישום עסקה
        await query(`
          INSERT INTO qs_billing_transactions (
            store_id, subscription_id, type, amount, vat_amount, total_amount,
            status, payplus_transaction_uid, payplus_approval_num,
            description, processed_at
          ) VALUES ($1, $2, 'plugin', $3, $4, $5, 'success', $6, $7, $8, now())
        `, [
          storeId,
          sub.id,
          sub.monthly_price,
          vatAmount,
          totalAmount,
          chargeResult.data.transaction_uid,
          chargeResult.data.approval_num,
          `חידוש תוסף: ${sub.plugin_name}`,
        ]);

        results.charged++;
        results.totalAmount += totalAmount;

      } catch (chargeError: any) {
        console.error(`[Plugin Billing] Failed to charge plugin ${sub.plugin_id}:`, chargeError);
        results.failed++;
        results.errors.push(`${sub.plugin_name}: ${chargeError.message}`);

        // רישום עסקה שנכשלה
        await query(`
          INSERT INTO qs_billing_transactions (
            store_id, subscription_id, type, amount, total_amount,
            status, description, failure_reason
          ) VALUES ($1, $2, 'plugin', $3, $4, 'failed', $5, $6)
        `, [
          storeId,
          sub.id,
          sub.monthly_price,
          sub.monthly_price * 1.17,
          `חידוש תוסף: ${sub.plugin_name} - נכשל`,
          chargeError.message,
        ]);
      }
    }

    results.success = results.failed === 0;
    return results;

  } catch (error: any) {
    console.error('[Plugin Billing] Error charging store plugins:', error);
    results.success = false;
    results.errors.push(error.message);
    return results;
  }
}

/**
 * בדיקה וכיבוי מנויים שפג תוקפם
 * נקרא מה-cron
 */
export async function deactivateExpiredSubscriptions(): Promise<number> {
  try {
    const today = new Date();
    
    // מנויים מבוטלים שעבר ה-end_date שלהם
    const expired = await query<{ id: number; plugin_id: number; store_id: number }>(
      `UPDATE plugin_subscriptions 
       SET is_active = false, updated_at = now()
       WHERE status = 'CANCELLED' 
       AND is_active = true
       AND end_date < $1
       RETURNING id, plugin_id, store_id`,
      [today]
    );

    // כיבוי התוספים
    for (const sub of expired) {
      await query(
        `UPDATE plugins SET is_active = false WHERE id = $1 AND store_id = $2`,
        [sub.plugin_id, sub.store_id]
      );
    }

    return expired.length;
  } catch (error) {
    console.error('[Plugin Billing] Error deactivating expired subscriptions:', error);
    return 0;
  }
}
