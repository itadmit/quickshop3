import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomer } from '@/lib/storefront-auth';

// GET - קבלת כל הכתובות של לקוח
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const addresses = await query<{
      id: number;
      customer_id: number;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
      address1: string | null;
      address2: string | null;
      city: string | null;
      province: string | null;
      country: string | null;
      zip: string | null;
      phone: string | null;
      name: string | null;
      province_code: string | null;
      country_code: string | null;
      country_name: string | null;
      default_address: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM customer_addresses
       WHERE customer_id = $1
       ORDER BY default_address DESC, created_at DESC`,
      [auth.customerId]
    );

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - יצירת כתובת חדשה
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const body = await req.json();
    const {
      first_name,
      last_name,
      address,
      houseNumber,
      apartment,
      floor,
      city,
      zip,
      phone,
      default_address = false,
    } = body;

    // בדיקת שדות חובה
    if (!first_name || !address || !houseNumber || !city) {
      return NextResponse.json(
        { error: 'שם פרטי, רחוב, מספר בית ועיר הם שדות חובה' },
        { status: 400 }
      );
    }

    // בניית כתובת מלאה
    const address1 = `${address} ${houseNumber}`.trim();
    const address2 = [apartment && `דירה ${apartment}`, floor && `קומה ${floor}`]
      .filter(Boolean)
      .join(', ');

    // אם זה כתובת ברירת מחדל, נסיר את הסימון מכל הכתובות האחרות
    if (default_address) {
      await query(
        `UPDATE customer_addresses 
         SET default_address = false 
         WHERE customer_id = $1`,
        [auth.customerId]
      );
    }

    // יצירת הכתובת החדשה
    const newAddress = await queryOne<{
      id: number;
      customer_id: number;
      first_name: string | null;
      last_name: string | null;
      address1: string | null;
      address2: string | null;
      city: string | null;
      zip: string | null;
      phone: string | null;
      default_address: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO customer_addresses (
        customer_id, first_name, last_name, address1, address2,
        city, zip, phone, country, country_code, country_name,
        default_address, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now()
      ) RETURNING *`,
      [
        auth.customerId,
        first_name,
        last_name || null,
        address1,
        address2 || null,
        city,
        zip || null,
        phone || null,
        'IL',
        'IL',
        'ישראל',
        default_address,
      ]
    );

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

