import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface ShippingRateResponse {
  id: number;
  name: string;
  price: number;
  free_shipping_threshold: number | null;
  min_order_subtotal: number | null;
  max_order_subtotal: number | null;
  is_pickup: boolean;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  cities?: Array<{
    city_name: string;
    price: number;
    free_shipping_threshold: number | null;
  }>;
}

// GET /api/storefront/[storeSlug]/shipping-rates - Get shipping rates for storefront
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city'); // אופציונלי - לחישוב מחיר לפי עיר
    const subtotal = searchParams.get('subtotal'); // אופציונלי - לסינון לפי סכום הזמנה

    // Get store by slug
    const store = await query<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!store || store.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const storeId = store[0].id;

    // Get all active shipping rates for this store
    const rates = await query<{
      id: number;
      name: string;
      price: string;
      free_shipping_threshold: string | null;
      min_order_subtotal: string | null;
      max_order_subtotal: string | null;
      is_pickup: boolean;
      delivery_days_min: number | null;
      delivery_days_max: number | null;
    }>(
      `SELECT sr.id, sr.name, sr.price, sr.free_shipping_threshold,
              sr.min_order_subtotal, sr.max_order_subtotal,
              sr.is_pickup, sr.delivery_days_min, sr.delivery_days_max
       FROM shipping_rates sr
       JOIN shipping_zones sz ON sr.shipping_zone_id = sz.id
       WHERE sz.store_id = $1
       ORDER BY sr.is_pickup ASC, sr.price ASC`,
      [storeId]
    );

    // Load cities for each rate
    const ratesWithCities: ShippingRateResponse[] = await Promise.all(
      rates.map(async (rate) => {
        const cities = await query<{
          city_name: string;
          price: string;
          free_shipping_threshold: string | null;
        }>(
          `SELECT city_name, price, free_shipping_threshold 
           FROM shipping_rate_cities 
           WHERE shipping_rate_id = $1`,
          [rate.id]
        );

        // חישוב מחיר סופי לפי עיר (אם סופקה)
        let finalPrice = parseFloat(rate.price);
        let finalFreeThreshold = rate.free_shipping_threshold ? parseFloat(rate.free_shipping_threshold) : null;

        if (city && cities.length > 0) {
          const cityRate = cities.find(c => c.city_name === city);
          if (cityRate) {
            finalPrice = parseFloat(cityRate.price);
            finalFreeThreshold = cityRate.free_shipping_threshold ? parseFloat(cityRate.free_shipping_threshold) : null;
          }
        }

        // בדיקת סף משלוח חינם - רק אם יש סף חיובי
        if (subtotal && finalFreeThreshold !== null && finalFreeThreshold > 0) {
          if (parseFloat(subtotal) >= finalFreeThreshold) {
            finalPrice = 0;
          }
        }

        return {
          id: rate.id,
          name: rate.name,
          price: finalPrice,
          free_shipping_threshold: finalFreeThreshold,
          min_order_subtotal: rate.min_order_subtotal ? parseFloat(rate.min_order_subtotal) : null,
          max_order_subtotal: rate.max_order_subtotal ? parseFloat(rate.max_order_subtotal) : null,
          is_pickup: rate.is_pickup,
          delivery_days_min: rate.delivery_days_min,
          delivery_days_max: rate.delivery_days_max,
          cities: cities.map(c => ({
            city_name: c.city_name,
            price: parseFloat(c.price),
            free_shipping_threshold: c.free_shipping_threshold ? parseFloat(c.free_shipping_threshold) : null,
          })),
        };
      })
    );

    // סינון לפי סכום הזמנה (אם רלוונטי)
    const filteredRates = subtotal
      ? ratesWithCities.filter(rate => {
          const orderAmount = parseFloat(subtotal);
          if (rate.min_order_subtotal !== null && orderAmount < rate.min_order_subtotal) return false;
          if (rate.max_order_subtotal !== null && orderAmount > rate.max_order_subtotal) return false;
          return true;
        })
      : ratesWithCities;

    return NextResponse.json({
      rates: filteredRates,
      defaultRate: filteredRates.find(r => !r.is_pickup) || filteredRates[0] || null,
    });
  } catch (error: any) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}

