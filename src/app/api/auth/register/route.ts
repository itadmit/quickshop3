import { NextRequest, NextResponse } from 'next/server';
import { getDb, query, queryOne } from '@/lib/db';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';

// Generate Shopify-like domain
function generateShopifyDomain(storeName: string): string {
  const sanitized = storeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${sanitized}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, storeName } = body;

    // Validation
    if (!name || !email || !password || !storeName) {
      return NextResponse.json(
        { error: 'כל השדות נדרשים' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM store_owners WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת האימייל כבר רשומה במערכת' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Start transaction
    const db = getDb();
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Create store owner
      const ownerResult = await client.query(
        `INSERT INTO store_owners (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [email, name, passwordHash]
      );
      const owner = ownerResult.rows[0];

      // Generate Shopify-like domain
      const myshopifyDomain = generateShopifyDomain(storeName);

      // Create store
      const storeResult = await client.query(
        `INSERT INTO stores (owner_id, name, myshopify_domain, currency, locale, timezone, plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, myshopify_domain, currency, locale, timezone, plan, created_at`,
        [owner.id, storeName, myshopifyDomain, 'ILS', 'he-IL', 'Asia/Jerusalem', 'free']
      );
      const store = storeResult.rows[0];

      await client.query('COMMIT');

      // Generate token
      const token = await generateToken({
        id: owner.id,
        email: owner.email,
        name: owner.name,
        store_id: store.id,
      });

      // Emit events
      await eventBus.emitEvent('user.created', {
        user: {
          id: owner.id,
          email: owner.email,
          name: owner.name,
        },
      }, {
        store_id: store.id,
        source: 'api',
        user_id: owner.id,
      });

      await eventBus.emitEvent('store.created', {
        store: {
          id: store.id,
          name: store.name,
          myshopify_domain: store.myshopify_domain,
          owner_id: owner.id,
          currency: store.currency,
          locale: store.locale,
          plan: store.plan,
        },
      }, {
        store_id: store.id,
        source: 'api',
        user_id: owner.id,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: owner.id,
          email: owner.email,
          name: owner.name,
        },
        store: {
          id: store.id,
          name: store.name,
          myshopify_domain: store.myshopify_domain,
        },
      });

      // Set session cookie
      return setSessionCookie(response, token);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}

