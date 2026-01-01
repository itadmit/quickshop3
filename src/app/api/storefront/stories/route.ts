// API Routes for Storefront Stories (public)
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

interface PublicStory {
  id: number;
  product_id: number;
  position: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  product_title: string;
  product_handle: string;
  product_price: number;
  product_compare_at_price: number | null;
  product_image: string | null;
  product_description: string | null;
  is_viewed: boolean;
  is_liked: boolean;
  variants: any[];
}

/**
 * GET /api/storefront/stories - Get stories for storefront display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('store');

    if (!storeSlug) {
      return NextResponse.json(
        { error: 'Store slug is required' },
        { status: 400 }
      );
    }

    // Get store ID
    const store = await queryOne<{ id: number }>(
      `SELECT id FROM stores WHERE slug = $1`,
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const storeId = store.id;

    // Check if stories are enabled
    const settings = await queryOne(
      `SELECT * FROM story_settings WHERE store_id = $1 AND is_enabled = true`,
      [storeId]
    );

    if (!settings) {
      return NextResponse.json({ stories: [], settings: null });
    }

    // Get session ID from cookie or create one
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('story_session')?.value;
    if (!sessionId) {
      sessionId = randomUUID();
    }

    // Get customer ID if logged in
    const customerId = cookieStore.get('customer_id')?.value;

    // Build inventory filter based on show_out_of_stock setting
    const showOutOfStock = settings.show_out_of_stock;
    const inventoryFilter = showOutOfStock 
      ? '' 
      : `AND EXISTS (
          SELECT 1 FROM product_variants pv2
          LEFT JOIN variant_inventory vi ON vi.variant_id = pv2.id
          WHERE pv2.product_id = p.id AND (vi.available > 0 OR vi.available IS NULL)
        )`;

    // Get stories with product info
    const stories = await query<PublicStory>(
      `SELECT 
        ps.id,
        ps.product_id,
        ps.position,
        ps.views_count,
        ps.likes_count,
        ps.comments_count,
        p.title as product_title,
        p.handle as product_handle,
        pv.price as product_price,
        pv.compare_at_price as product_compare_at_price,
        (SELECT pi.src FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) as product_image,
        p.body_html as product_description,
        CASE 
          WHEN sv.id IS NOT NULL THEN true 
          ELSE false 
        END as is_viewed,
        CASE 
          WHEN sl.id IS NOT NULL THEN true 
          ELSE false 
        END as is_liked
      FROM product_stories ps
      JOIN products p ON p.id = ps.product_id
      LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
      LEFT JOIN story_views sv ON sv.story_id = ps.id AND (sv.session_id = $2 OR sv.customer_id = $3)
      LEFT JOIN story_likes sl ON sl.story_id = ps.id AND (sl.session_id = $2 OR sl.customer_id = $3)
      WHERE ps.store_id = $1 AND ps.is_active = true AND p.status = 'active' ${inventoryFilter}
      ORDER BY 
        CASE WHEN sv.id IS NOT NULL THEN 1 ELSE 0 END ASC,
        ps.position ASC`,
      [storeId, sessionId, customerId || null]
    );

    // Get variants for each story
    const storiesWithVariants = await Promise.all(
      stories.map(async (story) => {
        const variants = await query(
          `SELECT 
            pv.id,
            pv.title,
            pv.price,
            pv.compare_at_price,
            pv.sku,
            vi.available as inventory_qty
          FROM product_variants pv
          LEFT JOIN variant_inventory vi ON vi.variant_id = pv.id
          WHERE pv.product_id = $1
          ORDER BY pv.position`,
          [story.product_id]
        );

        // Get options
        const options = await query(
          `SELECT 
            po.id,
            po.name,
            po.type,
            json_agg(json_build_object('id', pov.id, 'value', pov.value, 'metadata', pov.metadata) ORDER BY pov.position) as values
          FROM product_options po
          LEFT JOIN product_option_values pov ON pov.option_id = po.id
          WHERE po.product_id = $1
          GROUP BY po.id, po.name, po.type
          ORDER BY po.position`,
          [story.product_id]
        );

        return { ...story, variants, options };
      })
    );

    const response = NextResponse.json({
      stories: storiesWithVariants,
      settings: {
        display_mode: settings.display_mode,
        auto_advance_seconds: settings.auto_advance_seconds,
        show_product_info: settings.show_product_info,
        allow_likes: settings.allow_likes,
        allow_comments: settings.allow_comments,
        allow_quick_add: settings.allow_quick_add,
        circle_border_color: settings.circle_border_color,
        viewed_border_color: settings.viewed_border_color,
      },
    });

    // Set session cookie if new
    if (!cookieStore.get('story_session')) {
      response.cookies.set('story_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

