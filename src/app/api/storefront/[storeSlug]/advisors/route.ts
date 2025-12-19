/**
 * API: Get Active Advisors for Storefront
 * מחזיר את היועצים הפעילים לחנות
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);
    const floatingOnly = searchParams.get('floating') === 'true';

    // Get store by slug - query returns rows directly
    const storeRows = await query<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (storeRows.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const storeId = storeRows[0].id;

    // Check if show_floating_button column exists
    const columnRows = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'advisor_quizzes' 
      AND column_name = 'show_floating_button'
    `);
    const hasFloatingColumn = columnRows.length > 0;

    let queryText = `
      SELECT 
        id, title, slug, description, subtitle,
        primary_color, icon, image_url
        ${hasFloatingColumn ? ', show_floating_button' : ''}
      FROM advisor_quizzes
      WHERE store_id = $1 AND is_active = true
    `;
    const queryParams: (number | boolean)[] = [storeId];

    if (floatingOnly && hasFloatingColumn) {
      queryText += ' AND show_floating_button = true';
    } else if (floatingOnly && !hasFloatingColumn) {
      // If column doesn't exist, don't return any for floating (need schema update)
      return NextResponse.json({ advisors: [] });
    }

    queryText += ' ORDER BY created_at DESC';

    const advisors = await query(queryText, queryParams);

    return NextResponse.json({
      advisors,
    });
  } catch (error) {
    console.error('Error fetching advisors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advisors' },
      { status: 500 }
    );
  }
}
