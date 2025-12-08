import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { ContactCategory } from '@/types/contact';

// GET /api/contacts/categories - Get all contact categories for a store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    const categories = await query<ContactCategory>(
      `SELECT id, store_id, type, name, color, created_at, updated_at
       FROM contact_categories
       WHERE store_id = $1
       ORDER BY type ASC`,
      [storeId]
    );

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching contact categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact categories' },
      { status: 500 }
    );
  }
}

