import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomer } from '@/lib/storefront-auth';

// PUT - עדכון כתובת
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const { storeSlug, id } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const addressId = parseInt(id);
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
    }

    // בדיקה שהכתובת שייכת ללקוח
    const existingAddress = await queryOne<{ customer_id: number }>(
      'SELECT customer_id FROM customer_addresses WHERE id = $1',
      [addressId]
    );

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.customer_id !== auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
      default_address,
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
         WHERE customer_id = $1 AND id != $2`,
        [auth.customerId, addressId]
      );
    }

    // עדכון הכתובת
    const updatedAddress = await queryOne<{
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
      updated_at: Date;
    }>(
      `UPDATE customer_addresses SET
        first_name = $1,
        last_name = $2,
        address1 = $3,
        address2 = $4,
        city = $5,
        zip = $6,
        phone = $7,
        default_address = $8,
        updated_at = now()
      WHERE id = $9 AND customer_id = $10
      RETURNING *`,
      [
        first_name,
        last_name || null,
        address1,
        address2 || null,
        city,
        zip || null,
        phone || null,
        default_address || false,
        addressId,
        auth.customerId,
      ]
    );

    if (!updatedAddress) {
      return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
    }

    return NextResponse.json(updatedAddress);
  } catch (error: any) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - מחיקת כתובת
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const { storeSlug, id } = await params;
    const auth = await verifyStorefrontCustomer(req, storeSlug);
    if (!auth.success || !auth.customerId || !auth.store) {
      return auth.error!;
    }

    const addressId = parseInt(id);
    if (isNaN(addressId)) {
      return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
    }

    // בדיקה שהכתובת שייכת ללקוח
    const existingAddress = await queryOne<{ customer_id: number }>(
      'SELECT customer_id FROM customer_addresses WHERE id = $1',
      [addressId]
    );

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.customer_id !== auth.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // מחיקת הכתובת
    await query(
      'DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2',
      [addressId, auth.customerId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

