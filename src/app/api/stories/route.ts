// API Routes for Product Stories
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

interface StoryProduct {
  id: number;
  product_id: number;
  position: number;
  is_active: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  product_title: string;
  product_handle: string;
  product_price: number;
  product_compare_at_price: number | null;
  product_image: string | null;
  product_description: string | null;
}

/**
 * GET /api/stories - Get all stories for a store (dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;

    // Get stories with product info
    const stories = await query<StoryProduct>(
      `SELECT 
        ps.id,
        ps.product_id,
        ps.position,
        ps.is_active,
        ps.views_count,
        ps.likes_count,
        ps.comments_count,
        p.title as product_title,
        p.handle as product_handle,
        pv.price as product_price,
        pv.compare_at_price as product_compare_at_price,
        (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as product_image,
        p.body_html as product_description
      FROM product_stories ps
      JOIN products p ON p.id = ps.product_id
      LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
      WHERE ps.store_id = $1
      ORDER BY ps.position ASC`,
      [storeId]
    );

    // Get settings
    const settings = await queryOne(
      `SELECT * FROM story_settings WHERE store_id = $1`,
      [storeId]
    );

    return NextResponse.json({
      stories,
      settings: settings || {
        is_enabled: false,
        display_mode: 'home_only',
        auto_advance_seconds: 5,
        show_product_info: true,
        allow_likes: true,
        allow_comments: true,
        allow_quick_add: true,
        circle_border_color: '#e91e63',
        viewed_border_color: '#9e9e9e',
      },
    });
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stories - Add product to stories
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to store
    const product = await queryOne(
      `SELECT id FROM products WHERE id = $1 AND store_id = $2`,
      [productId, storeId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get max position
    const maxPos = await queryOne<{ max_pos: number }>(
      `SELECT COALESCE(MAX(position), 0) as max_pos FROM product_stories WHERE store_id = $1`,
      [storeId]
    );

    // Insert story
    const story = await queryOne(
      `INSERT INTO product_stories (store_id, product_id, position, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (store_id, product_id) DO UPDATE SET is_active = true, updated_at = now()
       RETURNING *`,
      [storeId, productId, (maxPos?.max_pos || 0) + 1]
    );

    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('Error adding story:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add story' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/stories - Update stories order or settings
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body = await request.json();

    // Update settings
    if (body.settings) {
      const {
        is_enabled,
        display_mode,
        auto_advance_seconds,
        show_product_info,
        allow_likes,
        allow_comments,
        allow_quick_add,
        circle_border_color,
        viewed_border_color,
      } = body.settings;

      await query(
        `INSERT INTO story_settings (
          store_id, is_enabled, display_mode, auto_advance_seconds,
          show_product_info, allow_likes, allow_comments, allow_quick_add,
          circle_border_color, viewed_border_color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (store_id) DO UPDATE SET
          is_enabled = EXCLUDED.is_enabled,
          display_mode = EXCLUDED.display_mode,
          auto_advance_seconds = EXCLUDED.auto_advance_seconds,
          show_product_info = EXCLUDED.show_product_info,
          allow_likes = EXCLUDED.allow_likes,
          allow_comments = EXCLUDED.allow_comments,
          allow_quick_add = EXCLUDED.allow_quick_add,
          circle_border_color = EXCLUDED.circle_border_color,
          viewed_border_color = EXCLUDED.viewed_border_color,
          updated_at = now()`,
        [
          storeId,
          is_enabled ?? false,
          display_mode ?? 'home_only',
          auto_advance_seconds ?? 5,
          show_product_info ?? true,
          allow_likes ?? true,
          allow_comments ?? true,
          allow_quick_add ?? true,
          circle_border_color ?? '#e91e63',
          viewed_border_color ?? '#9e9e9e',
        ]
      );
    }

    // Update order
    if (body.order && Array.isArray(body.order)) {
      for (let i = 0; i < body.order.length; i++) {
        await query(
          `UPDATE product_stories SET position = $1, updated_at = now() 
           WHERE id = $2 AND store_id = $3`,
          [i, body.order[i], storeId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating stories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update stories' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stories - Remove product from stories
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('id');

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    await query(
      `DELETE FROM product_stories WHERE id = $1 AND store_id = $2`,
      [storyId, storeId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete story' },
      { status: 500 }
    );
  }
}

