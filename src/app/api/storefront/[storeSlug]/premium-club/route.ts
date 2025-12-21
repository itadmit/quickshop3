import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * GET /api/storefront/[storeSlug]/premium-club
 * מחזיר את הגדרות מועדון הלקוחות וההנחות הזמינות
 * לתצוגה בעמוד המוצר (מחיר לחברי מועדון)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    
    // Get store ID
    const store = await queryOne<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json({ enabled: false });
    }

    // Get premium club config
    const config = await queryOne<{
      enabled: boolean;
      config: any;
    }>(
      `SELECT enabled, config
       FROM premium_club_config
       WHERE store_id = $1`,
      [store.id]
    );

    if (!config || !config.enabled) {
      return NextResponse.json({ enabled: false });
    }

    const premiumConfig = config.config;
    
    // מציאת ההנחה הכי גדולה מבין כל הרמות (כדי להציג ללקוחות שאינם חברים)
    let maxDiscount: { type: 'PERCENTAGE' | 'FIXED'; value: number } | null = null;
    let lowestTier: { slug: string; name: string; discount: { type: string; value: number } | null } | null = null;
    
    if (premiumConfig?.tiers && premiumConfig.tiers.length > 0) {
      // מיון לפי priority (הנמוך ביותר = רמה הכי נמוכה)
      const sortedTiers = [...premiumConfig.tiers].sort((a: any, b: any) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // מציאת הרמה הנמוכה ביותר עם הנחה (זו שקל להצטרף אליה)
      for (const tier of sortedTiers) {
        if (tier.discount && tier.discount.value > 0) {
          lowestTier = {
            slug: tier.slug,
            name: tier.name,
            discount: tier.discount,
          };
          break;
        }
      }

      // מציאת ההנחה הגבוהה ביותר מכל הרמות (לתצוגה)
      for (const tier of premiumConfig.tiers) {
        if (tier.discount && tier.discount.value > 0) {
          if (!maxDiscount || tier.discount.value > maxDiscount.value) {
            maxDiscount = tier.discount;
          }
        }
      }
    }

    // אם אין הנחות, לא להציג את התוכנית
    if (!lowestTier) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      lowestTier: lowestTier,
      maxDiscount: maxDiscount,
      signupUrl: `/shops/${storeSlug}/register`, // לינק להרשמה למועדון
    });
  } catch (error: any) {
    console.error('Error fetching premium club config:', error);
    return NextResponse.json({ enabled: false });
  }
}

