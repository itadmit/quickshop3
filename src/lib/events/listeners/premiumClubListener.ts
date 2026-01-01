/**
 * Premium Club Listener - מאזין לאירועי הזמנות ועדכן רמות לקוחות
 * 
 * Listens to:
 * - order.created: עדכון רמת לקוח לפי סכום והזמנות (סופר את כל ההזמנות)
 * - order.paid: עדכון רמת לקוח כשהזמנה משולמת
 */

import { eventBus } from '../eventBus';
import { query, queryOne } from '@/lib/db';
import { getPremiumClubConfig, calculateCustomerTier, PremiumClubTier } from '@/lib/services/premiumClub';
import { EmailEngine } from '@/lib/services/email-engine';

interface CustomerData {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  premium_club_tier: string | null;
  total_spent: string;
  orders_count: number;
}

// פונקציה לעדכון רמת לקוח (משותפת לכל האירועים)
async function updateCustomerTier(
  customerId: number,
  storeId: number,
  config: { enabled: boolean; tiers: PremiumClubTier[]; notifications?: { tierUpgradeEmail?: boolean; tierUpgradeSMS?: boolean } }
) {
  // קבלת הלקוח עם סטטיסטיקות
  // ✅ סופר את כל ההזמנות (לא רק paid) כדי לזהות מועדון נאמנות מיידית
  const customer = await queryOne<CustomerData>(
    `SELECT 
      c.id,
      c.email,
      c.first_name,
      c.last_name,
      c.premium_club_tier,
      COALESCE(SUM(o.total_price::numeric), 0) as total_spent,
      COUNT(DISTINCT o.id) as orders_count
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id AND o.financial_status != 'cancelled' AND o.financial_status != 'voided'
    WHERE c.id = $1 AND c.store_id = $2
    GROUP BY c.id`,
    [customerId, storeId]
  );

  if (!customer) {
    console.log(`[PremiumClub] Customer ${customerId} not found`);
    return;
  }

  const totalSpent = parseFloat(customer.total_spent || '0');
  const orderCount = customer.orders_count || 0;

  console.log(`[PremiumClub] Customer ${customerId} stats: orders=${orderCount}, spent=${totalSpent}`);

  // חישוב רמה חדשה
  const newTier = calculateCustomerTier(totalSpent, orderCount, config.tiers);

  console.log(`[PremiumClub] Calculated tier for customer ${customerId}: ${newTier || 'none'} (current: ${customer.premium_club_tier || 'none'})`);

  // עדכון רמה אם השתנתה
  const currentTier = customer.premium_club_tier;
  if (newTier && newTier !== currentTier) {
    const oldTier = currentTier;
    const tier = config.tiers.find((t) => t.slug === newTier);

    // עדכון רמה במסד הנתונים
    await query(
      `UPDATE customers 
       SET premium_club_tier = $1, updated_at = now()
       WHERE id = $2 AND store_id = $3`,
      [newTier, customerId, storeId]
    );

    console.log(`[PremiumClub] ✅ Customer ${customerId} upgraded from ${oldTier || 'none'} to ${newTier}`);

    // שליחת אימייל אם מוגדר
    if (config.notifications?.tierUpgradeEmail && customer.email && tier) {
      try {
        const customerName = customer.first_name || customer.email.split('@')[0];
        const tierName = tier.name;
        const oldTierName = oldTier
          ? config.tiers.find((t) => t.slug === oldTier)?.name || oldTier
          : 'רגיל';

        // בניית תוכן האימייל
        const emailSubject = `🎉 מזל טוב! עלית לרמה ${tierName} במועדון הפרימיום!`;
        const emailHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>עלית לרמה ${tierName}</title>
            <style>
              * {
                direction: rtl;
                text-align: right;
              }
              body {
                direction: rtl;
                text-align: right;
              }
              ul {
                direction: rtl;
                text-align: right;
              }
              li {
                direction: rtl;
                text-align: right;
              }
            </style>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 מזל טוב ${customerName}!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; direction: rtl; text-align: right;">
              <p style="font-size: 18px; margin-bottom: 20px; direction: rtl; text-align: right;">
                עלית לרמה <strong style="color: ${tier.color || '#667eea'};">${tierName}</strong> במועדון הפרימיום שלנו!
              </p>
              
              ${oldTier ? `<p style="color: #666; margin-bottom: 20px; direction: rtl; text-align: right;">עלית מרמה <strong>${oldTierName}</strong> לרמה <strong>${tierName}</strong></p>` : ''}
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid ${tier.color || '#667eea'}; direction: rtl; text-align: right;">
                <h2 style="color: ${tier.color || '#667eea'}; margin-top: 0; direction: rtl; text-align: right;">הטבות הרמה החדשה שלך:</h2>
                <ul style="list-style: none; padding: 0; direction: rtl; text-align: right;">
                  ${tier.benefits.freeShipping ? '<li style="padding: 8px 0; direction: rtl; text-align: right;">✅ משלוח חינם על כל ההזמנות</li>' : ''}
                  ${tier.benefits.earlyAccess ? '<li style="padding: 8px 0; direction: rtl; text-align: right;">✅ גישה מוקדמת למבצעים מיוחדים</li>' : ''}
                  ${tier.benefits.exclusiveProducts ? '<li style="padding: 8px 0; direction: rtl; text-align: right;">✅ גישה למוצרים בלעדיים</li>' : ''}
                  ${tier.benefits.birthdayGift ? '<li style="padding: 8px 0; direction: rtl; text-align: right;">✅ מתנת יום הולדת מיוחדת</li>' : ''}
                  ${tier.discount ? `<li style="padding: 8px 0; direction: rtl; text-align: right;">✅ הנחה ${tier.discount.type === 'PERCENTAGE' ? tier.discount.value + '%' : '₪' + tier.discount.value} על כל הרכישות</li>` : ''}
                  ${tier.benefits.pointsMultiplier ? `<li style="padding: 8px 0; direction: rtl; text-align: right;">✅ צבירת נקודות x${tier.benefits.pointsMultiplier}</li>` : ''}
                </ul>
              </div>
              
              <p style="margin-top: 30px; color: #666; direction: rtl; text-align: right;">
                תודה על הנאמנות שלך! אנו שמחים להיות חלק מהמסע שלך.
              </p>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px; direction: rtl; text-align: right;">
                ההטבות שלך כבר פעילות בחשבון שלך. תוכל לראות את הרמה החדשה שלך באזור האישי.
              </p>
            </div>
          </body>
          </html>
        `;

        // שליחת אימייל דרך EmailEngine
        const emailEngine = new EmailEngine(storeId);
        await emailEngine.sendEmail({
          to: customer.email,
          subject: emailSubject,
          html: emailHtml,
        });

        console.log(`[PremiumClub] ✅ Tier upgrade email sent to ${customer.email} for upgrade to ${tierName}`);
      } catch (emailError) {
        // לא נכשל את העדכון אם יש בעיה בשליחת האימייל
        console.error('[PremiumClub] Error sending tier upgrade email:', emailError);
      }
    }

    if (config.notifications?.tierUpgradeSMS) {
      // TODO: שליחת SMS (אם יש מערכת SMS)
      console.log(`[PremiumClub] SMS notification for tier upgrade to ${tier?.name || newTier} - SMS not implemented yet`);
    }
  }
}

// מאזין ל-order.created - עדכון רמת לקוח מיידית
eventBus.on('order.created', async (event) => {
  try {
    const { order } = event.payload;
    
    if (!order || !order.customer_id) {
      console.log('[PremiumClub] order.created - missing customer_id, skipping');
      return;
    }

    const storeId = event.store_id;
    const customerId = order.customer_id;

    console.log(`[PremiumClub] order.created event received for customer ${customerId}, store ${storeId}`);

    // טעינת הגדרות premium club
    const config = await getPremiumClubConfig(storeId);
    if (!config || !config.enabled || !config.tiers || config.tiers.length === 0) {
      console.log('[PremiumClub] Premium club not enabled or no tiers configured');
      return;
    }

    await updateCustomerTier(customerId, storeId, config);
  } catch (error) {
    console.error('[PremiumClub] Error updating premium club tier on order.created:', error);
  }
});

// מאזין ל-order.paid - עדכון רמת לקוח כשהזמנה משולמת
eventBus.on('order.paid', async (event) => {
  try {
    const { order, order_id } = event.payload;
    
    // נסה לקבל customer_id מהאובייקט או מה-order_id
    let customerId = order?.customer_id;
    
    if (!customerId && order_id) {
      // אם אין customer_id באירוע, נשלוף מהמסד
      const orderData = await queryOne<{ customer_id: number }>(
        'SELECT customer_id FROM orders WHERE id = $1',
        [order_id]
      );
      customerId = orderData?.customer_id;
    }

    if (!customerId) {
      console.log('[PremiumClub] order.paid - missing customer_id, skipping');
      return;
    }

    const storeId = event.store_id;

    console.log(`[PremiumClub] order.paid event received for customer ${customerId}, store ${storeId}`);

    // טעינת הגדרות premium club
    const config = await getPremiumClubConfig(storeId);
    if (!config || !config.enabled || !config.tiers || config.tiers.length === 0) {
      console.log('[PremiumClub] Premium club not enabled or no tiers configured');
      return;
    }

    await updateCustomerTier(customerId, storeId, config);
  } catch (error) {
    console.error('[PremiumClub] Error updating premium club tier on order.paid:', error);
  }
});

