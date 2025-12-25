import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { SignJWT } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, email, phone, code } = body;

    // Validation
    if (!storeSlug || !code || (!email && !phone)) {
      return NextResponse.json(
        { error: 'כל השדות נדרשים' },
        { status: 400 }
      );
    }

    // Find store
    const store = await queryOne<{
      id: number;
      name: string;
      slug: string;
    }>(
      'SELECT id, name, slug FROM stores WHERE slug = $1 OR myshopify_domain = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json(
        { error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }

    // Normalize email for case-insensitive comparison
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // Find customer (case-insensitive email comparison)
    const customer = await queryOne<{
      id: number;
      email: string | null;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
      premium_club_tier: string | null;
      state: string;
    }>(
      `SELECT id, email, phone, first_name, last_name, premium_club_tier, state 
       FROM customers 
       WHERE store_id = $1 AND (LOWER(TRIM(email)) = LOWER(TRIM($2::text)) OR phone = $3)`,
      [store.id, normalizedEmail, phone || null]
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'לקוח לא נמצא' },
        { status: 404 }
      );
    }

    // Check if customer is enabled
    if (customer.state !== 'enabled') {
      return NextResponse.json(
        { error: 'החשבון שלך מושבת. אנא פנה לתמיכה' },
        { status: 403 }
      );
    }

    // Get the OTP (time check done in JavaScript for timezone consistency)
    const otp = await queryOne<{
      id: number;
      attempts: number;
      max_attempts: number;
      expires_at: Date;
    }>(
      `SELECT id, attempts, max_attempts, expires_at 
       FROM otp_codes 
       WHERE store_id = $1 AND customer_id = $2 AND code = $3 
       AND used_at IS NULL`,
      [store.id, customer.id, code]
    );
    
    // Check expiration in JavaScript
    if (otp && new Date(otp.expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'קוד פג תוקף. אנא בקש קוד חדש' },
        { status: 401 }
      );
    }

    if (!otp) {
      // Increment attempts for any recent OTP for this customer
      await queryOne(
        `UPDATE otp_codes 
         SET attempts = attempts + 1 
         WHERE customer_id = $1 AND used_at IS NULL
         RETURNING id`,
        [customer.id]
      );

      return NextResponse.json(
        { error: 'קוד שגוי או פג תוקף. אנא נסה שוב או בקש קוד חדש' },
        { status: 401 }
      );
    }

    // Check attempts
    if (otp.attempts >= otp.max_attempts) {
      return NextResponse.json(
        { error: 'יותר מדי ניסיונות שגויים. אנא בקש קוד חדש' },
        { status: 401 }
      );
    }

    // Verify code matches
    // (Already verified by query above, but double-check)
    if (otp.expires_at < new Date()) {
      return NextResponse.json(
        { error: 'קוד פג תוקף. אנא בקש קוד חדש' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await queryOne(
      `UPDATE otp_codes 
       SET used_at = now() 
       WHERE id = $1`,
      [otp.id]
    );

    // Generate JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const token = await new SignJWT({
      customer_id: customer.id,
      store_id: store.id,
      email: customer.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Return customer data and token
    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        first_name: customer.first_name,
        last_name: customer.last_name,
        premium_club_tier: customer.premium_club_tier,
      },
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה באימות קוד' },
      { status: 500 }
    );
  }
}



