// Premium Club Plugin - מערכת חברי מועדון פרימיום
// מערכת רמות מתקדמת עם הנחות, הטבות ופיצ'רים נוספים

import { PluginHook } from '@/types/plugin';
import { query, queryOne } from '@/lib/db';
import { getPluginConfig } from '@/lib/plugins/loader';

export const PremiumClubPlugin: PluginHook = {
  // עדכון רמת הלקוח אחרי הזמנה
  onOrderComplete: async (order: any, storeId: number) => {
    if (!order.customer_id) return;

    try {
      // טעינת הגדרות התוסף
      const config = await getPluginConfig(storeId, 'premium-club');
      if (!config || !config.enabled || !config.tiers || config.tiers.length === 0) {
        return;
      }

      // קבלת הלקוח עם סטטיסטיקות
      const customer = await queryOne<{
        id: number;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
        premium_club_tier: string | null;
        total_spent: string;
        orders_count: number;
      }>(
        `SELECT 
          c.id,
          c.email,
          c.first_name,
          c.last_name,
          c.premium_club_tier,
          COALESCE(SUM(o.total_price::numeric), 0) as total_spent,
          COUNT(DISTINCT o.id) as orders_count
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        WHERE c.id = $1 AND c.store_id = $2
        GROUP BY c.id`,
        [order.customer_id, storeId]
      );

      if (!customer) {
        return;
      }

      const totalSpent = parseFloat(customer.total_spent || '0');
      const orderCount = customer.orders_count || 0;

      // חישוב רמה חדשה
      const newTier = calculateCustomerTier(totalSpent, orderCount, config.tiers);

      // עדכון רמה אם השתנתה
      const currentTier = customer.premium_club_tier;
      if (newTier && newTier !== currentTier) {
        await query(
          `UPDATE customers 
           SET premium_club_tier = $1
           WHERE id = $2 AND store_id = $3`,
          [newTier, customer.id, storeId]
        );

        // TODO: שליחת התראה אם מוגדר
        // if (config.notifications?.tierUpgradeEmail && customer.email) {
        //   await sendTierUpgradeEmail(customer, newTier, config);
        // }
      }
    } catch (error) {
      console.error('Error updating premium club tier:', error);
    }
  },
};

/**
 * חישוב רמת הלקוח לפי סכום והזמנות
 */
function calculateCustomerTier(
  totalSpent: number,
  orderCount: number,
  tiers: any[]
): string | null {
  if (!tiers || tiers.length === 0) return null;

  // מיון לפי עדיפות (priority נמוך יותר = רמה גבוהה יותר)
  const sortedTiers = [...tiers].sort((a, b) => a.priority - b.priority);

  let bestTier: any | null = null;

  for (const tier of sortedTiers) {
    // בדיקה אם הלקוח עומד בדרישות הרמה
    const meetsSpentRequirement = tier.minSpent != null ? totalSpent >= tier.minSpent : true;
    const meetsOrderRequirement = tier.minOrders != null ? orderCount >= tier.minOrders : true;

    if (meetsSpentRequirement && meetsOrderRequirement) {
      // אם זו רמה ללא דרישות, נשמור אותה כרמה בסיסית
      if (tier.minSpent == null && tier.minOrders == null) {
        if (!bestTier) bestTier = tier;
      } else {
        // אם יש דרישות, זו רמה גבוהה יותר - נשמור אותה
        bestTier = tier;
      }
    }
  }

  return bestTier?.slug || null;
}

/**
 * חישוב הנחה לפי רמה
 */
export async function calculatePremiumClubDiscount(
  storeId: number,
  customerTier: string | null,
  basePrice: number
): Promise<number> {
  if (!customerTier) return 0;

  try {
    const config = await getPluginConfig(storeId, 'premium-club');
    if (!config || !config.enabled || !config.tiers || config.tiers.length === 0) {
      return 0;
    }

    const tier = config.tiers.find((t: any) => t.slug === customerTier);
    if (!tier || !tier.discount) return 0;

    if (tier.discount.type === 'PERCENTAGE') {
      return (basePrice * tier.discount.value) / 100;
    } else {
      return tier.discount.value;
    }
  } catch (error) {
    console.error('Error calculating premium club discount:', error);
    return 0;
  }
}



