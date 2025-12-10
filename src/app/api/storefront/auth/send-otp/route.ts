import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, email, phone } = body;

    // Validation
    if (!storeSlug || (!email && !phone)) {
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
    
    console.log(`[OTP] Store found: id=${store.id}, name=${store.name}, slug=${store.slug}, requested_slug=${storeSlug}`);

    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email ? email.toLowerCase().trim() : null;
    
    // Check if email belongs to store_owner - store owners should login via admin dashboard, not storefront
    const storeOwner = await queryOne<{
      id: number;
      email: string;
    }>(
      `SELECT id, email FROM store_owners WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
      [normalizedEmail]
    );
    
    if (storeOwner) {
      console.log(`[OTP] Email ${normalizedEmail} belongs to store_owner (id: ${storeOwner.id}), blocking storefront login`);
      return NextResponse.json(
        { error: 'בעלי חנויות מתחברים דרך דשבורד המנהל. אנא השתמש בדף ההתחברות למנהלים.' },
        { status: 403 }
      );
    }
    
    console.log(`[OTP] Email ${normalizedEmail} is not a store_owner, checking customers...`);
    
    // Find existing customer only - don't create new customers on login
    // Use LOWER() for case-insensitive email comparison
    const customer = await queryOne<{
      id: number;
      email: string | null;
      phone: string | null;
      first_name: string | null;
      last_name: string | null;
      state: string;
    }>(
      `SELECT id, email, phone, first_name, last_name, state 
       FROM customers 
       WHERE store_id = $1 
       AND (
         (LOWER(TRIM(email)) = LOWER(TRIM($2::text))) 
         OR phone = $3
       )`,
      [store.id, normalizedEmail, phone || null]
    );

    // Customer must exist - don't allow login for non-registered emails
    if (!customer) {
      console.log(`[OTP] Customer not found for email: ${normalizedEmail}, store_id: ${store.id}, store_slug: ${storeSlug}`);
      return NextResponse.json(
        { error: 'חשבון לא נמצא. אנא הירשם תחילה או בדוק את כתובת המייל' },
        { status: 404 }
      );
    }
    
    console.log(`[OTP] Customer found: ${customer.id}, email: ${customer.email}, store_id: ${store.id}`);

    // Check if customer is enabled
    if (customer.state !== 'enabled') {
      return NextResponse.json(
        { error: 'החשבון שלך מושבת. אנא פנה לתמיכה' },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get client IP
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Invalidate previous unused OTPs for this customer
    await query(
      `UPDATE otp_codes 
       SET used_at = now() 
       WHERE customer_id = $1 AND used_at IS NULL AND expires_at > now()`,
      [customer.id]
    );

    // Save OTP code
    const otpType = email ? 'email' : 'sms';
    await query(
      `INSERT INTO otp_codes (store_id, customer_id, email, phone, code, type, expires_at, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [store.id, customer.id, email || null, phone || null, code, otpType, expiresAt, ipAddress]
    );

    // Send OTP via email or SMS
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `קוד התחברות - ${store.name}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #111827;">שלום ${customer.first_name || 'לקוח יקר'},</h2>
              <p style="color: #4B5563; font-size: 16px;">
                קיבלנו בקשת התחברות לחשבון שלך ב-${store.name}.
              </p>
              <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <p style="color: #111827; font-size: 14px; margin-bottom: 10px;">קוד ההתחברות שלך:</p>
                <p style="color: #111827; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">
                  ${code}
                </p>
              </div>
              <p style="color: #6B7280; font-size: 14px;">
                הקוד תקף ל-10 דקות בלבד.
              </p>
              <p style="color: #6B7280; font-size: 14px;">
                אם לא ביקשת קוד זה, תוכל להתעלם מהמייל הזה.
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
              <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                ${store.name}
              </p>
            </div>
          `,
          text: `קוד ההתחברות שלך ל-${store.name} הוא: ${code}. הקוד תקף ל-10 דקות.`,
          storeId: store.id,
        });
      } catch (emailError: any) {
        console.error('Error sending OTP email:', emailError);
        // Don't fail if email sending fails - OTP is still saved
        // In production, you might want to handle this differently
      }
    } else if (phone) {
      // TODO: Implement SMS sending when SMS provider is configured
      // For now, we'll just save the OTP
      console.log(`SMS OTP for ${phone}: ${code} (SMS not yet implemented)`);
    }

    return NextResponse.json({
      success: true,
      message: email ? 'קוד נשלח למייל שלך' : 'קוד נשלח לנייד שלך',
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בשליחת קוד' },
      { status: 500 }
    );
  }
}

