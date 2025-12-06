import { NextRequest, NextResponse } from 'next/server';
import { getDb, query, queryOne } from '@/lib/db';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';

// Generate Quickshop domain identifier
function generateQuickshopDomain(storeName: string): string {
  const sanitized = storeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${sanitized}-${randomSuffix}`;
}

// Validate slug: only English letters and numbers, no spaces or special characters
function validateSlug(slug: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(slug);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, storeName, storeSlug } = body;

    // Validation
    if (!name || !email || !password || !storeName || !storeSlug) {
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

    // Validate slug format
    if (!validateSlug(storeSlug)) {
      return NextResponse.json(
        { error: 'כתובת החנות יכולה להכיל רק אותיות באנגלית ומספרים, ללא רווחים או סימנים מיוחדים' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingStore = await queryOne(
      'SELECT id FROM stores WHERE slug = $1',
      [storeSlug.toLowerCase()]
    );

    if (existingStore) {
      return NextResponse.json(
        { error: 'כתובת החנות כבר תפוסה. נסה כתובת אחרת' },
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

      // Generate Quickshop domain identifier
      const quickshopDomain = generateQuickshopDomain(storeName);
      const normalizedSlug = storeSlug.toLowerCase();

      // Create store
      const storeResult = await client.query(
        `INSERT INTO stores (owner_id, name, slug, myshopify_domain, currency, locale, timezone, plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, slug, myshopify_domain, currency, locale, timezone, plan, created_at`,
        [owner.id, storeName, normalizedSlug, quickshopDomain, 'ILS', 'he-IL', 'Asia/Jerusalem', 'free']
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
          slug: store.slug,
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

