import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomerOptional } from '@/lib/storefront-auth';
import { getPremiumClubConfig, calculateCustomerTier } from '@/lib/services/premiumClub';

/**
 * GET /api/storefront/[storeSlug]/premium-club/progress
 * מחזיר את המידע על מועדון הפרימיום עבור הלקוח המחובר
 * כולל רמה נוכחית, פרוגרס לרמה הבאה, וכל הרמות הזמינות
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    
    // אימות הלקוח (אופציונלי - לא מחייב התחברות)
    const auth = await verifyStorefrontCustomerOptional(request, storeSlug);
    if (!auth.store) {
      return NextResponse.json({ enabled: false });
    }

    const storeId = auth.store.id;

    // טעינת הגדרות מועדון הפרימיום
    const config = await getPremiumClubConfig(storeId);
    if (!config || !config.enabled || !config.tiers || config.tiers.length === 0) {
      return NextResponse.json({ 
        enabled: false,
        message: 'מועדון הפרימיום לא פעיל' 
      });
    }

    // קבלת מידע על הלקוח (אם מחובר)
    let customer: {
      id: number;
      premium_club_tier: string | null;
      total_spent: string;
      orders_count: number;
    } | null = null;

    if (auth.success && auth.customerId) {
      customer = await queryOne<{
        id: number;
        premium_club_tier: string | null;
        total_spent: string;
        orders_count: number;
      }>(
        `SELECT 
          c.id,
          c.premium_club_tier,
          COALESCE(SUM(o.total_price::numeric), 0) as total_spent,
          COUNT(DISTINCT o.id) as orders_count
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.financial_status = 'paid'
        WHERE c.id = $1 AND c.store_id = $2
        GROUP BY c.id`,
        [auth.customerId, storeId]
      );
    }

    const totalSpent = parseFloat(customer?.total_spent || '0');
    const orderCount = customer?.orders_count || 0;

    // ✅ חישוב רמה נוכחית - אם יש רמה שמורה, נשתמש בה, אחרת נחשב לפי הדרישות
    let currentTierSlug = customer?.premium_club_tier || null;
    if (!currentTierSlug && customer) {
      // אם אין רמה שמורה, נחשב לפי הדרישות
      currentTierSlug = calculateCustomerTier(totalSpent, orderCount, config.tiers);
    }
    
    // מציאת הרמה הנוכחית והבאה
    const sortedTiers = [...config.tiers].sort((a, b) => a.priority - b.priority);
    const currentTier = currentTierSlug ? sortedTiers.find(t => t.slug === currentTierSlug) : null;
    const currentTierIndex = currentTier ? sortedTiers.indexOf(currentTier) : -1;
    
    // ✅ אם אין רמה נוכחית, הרמה הבאה היא הרמה הראשונה (עם priority הכי גבוה)
    // אם יש רמה נוכחית, הרמה הבאה היא הרמה הבאה ברשימה
    let nextTier: typeof sortedTiers[0] | null = null;
    if (!currentTier) {
      // אם הלקוח עדיין לא חבר, הרמה הבאה היא הרמה הראשונה
      nextTier = sortedTiers.length > 0 ? sortedTiers[0] : null;
    } else if (currentTierIndex >= 0 && currentTierIndex < sortedTiers.length - 1) {
      // אם יש רמה נוכחית, הרמה הבאה היא הרמה הבאה ברשימה
      nextTier = sortedTiers[currentTierIndex + 1];
    }

    // חישוב פרוגרס לרמה הבאה
    let progressToNextTier: {
      current: number;
      target: number;
      percentage: number;
      spentProgress: number;
      ordersProgress: number;
    } | null = null;

    if (nextTier) {
      const spentProgress = nextTier.minSpent 
        ? Math.min(100, (totalSpent / nextTier.minSpent) * 100)
        : 100;
      const ordersProgress = nextTier.minOrders 
        ? Math.min(100, (orderCount / nextTier.minOrders) * 100)
        : 100;
      
      // הפרוגרס הוא המינימום בין שני הדרישות
      const overallProgress = Math.min(spentProgress, ordersProgress);
      
      progressToNextTier = {
        current: overallProgress,
        target: 100,
        percentage: overallProgress,
        spentProgress,
        ordersProgress,
      };
    }

    // הכנת תגיות צבע לרמות
    const tierColors: Record<string, string> = {
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'platinum': '#E5E4E2',
    };

    return NextResponse.json({
      enabled: true,
      currentTier: currentTier ? {
        slug: currentTier.slug,
        name: currentTier.name,
        color: currentTier.color || tierColors[currentTier.slug] || '#d1d5db',
        discount: currentTier.discount,
        benefits: currentTier.benefits || [],
      } : null,
      nextTier: nextTier ? {
        slug: nextTier.slug,
        name: nextTier.name,
        color: nextTier.color || tierColors[nextTier.slug] || '#d1d5db',
        discount: nextTier.discount,
        benefits: nextTier.benefits || [],
        minSpent: nextTier.minSpent,
        minOrders: nextTier.minOrders,
      } : null,
      progress: progressToNextTier,
      stats: {
        totalSpent,
        totalOrders: orderCount,
      },
      allTiers: sortedTiers.map(tier => ({
        slug: tier.slug,
        name: tier.name,
        color: tier.color || tierColors[tier.slug] || '#d1d5db',
        discount: tier.discount,
        benefits: tier.benefits || [],
        minSpent: tier.minSpent,
        minOrders: tier.minOrders,
        priority: tier.priority,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching premium club progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch premium club progress' },
      { status: 500 }
    );
  }
}

