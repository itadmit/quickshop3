import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/contacts/categories/init - Initialize default categories for store
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // Initialize default categories
    const defaultCategories = [
      { type: 'CUSTOMER', name: 'לקוחות', color: '#10b981' },
      { type: 'CLUB_MEMBER', name: 'חברי מועדון', color: '#3b82f6' },
      { type: 'NEWSLETTER', name: 'דיוור', color: '#f97316' },
      { type: 'CONTACT_FORM', name: 'יצירת קשר', color: '#a855f7' },
    ];

    for (const category of defaultCategories) {
      await query(
        `INSERT INTO contact_categories (store_id, type, name, color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (store_id, type) DO NOTHING`,
        [storeId, category.type, category.name, category.color]
      );
    }

    return NextResponse.json({ success: true, message: 'Categories initialized' });
  } catch (error: any) {
    console.error('Error initializing categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize categories' },
      { status: 500 }
    );
  }
}

