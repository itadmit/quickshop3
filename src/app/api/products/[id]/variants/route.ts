import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductVariant } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopItem } from '@/lib/utils/apiFormatter';
import { getVariantTitle } from '@/lib/utils/variant-title';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/products/[id]/variants - Get all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    // Verify product exists and belongs to user's store
    const product = await queryOne<{ store_id: number }>(
      'SELECT store_id FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all variants for this product
    const variants = await query<ProductVariant>(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY position',
      [productId]
    );

    return NextResponse.json({ variants }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/variants - Create variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    // Verify product exists and belongs to user's store
    const product = await queryOne<{ store_id: number }>(
      'SELECT store_id FROM products WHERE id = $1 AND store_id = $2',
      [productId, user.store_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get max position for this product
    const maxPosition = await queryOne<{ max: number }>(
      'SELECT COALESCE(MAX(position), 0) as max FROM product_variants WHERE product_id = $1',
      [productId]
    );

    // בנה title מ-options אם יש, אחרת השתמש ב-title הקיים
    const variantTitle = getVariantTitle(
      body.title,
      body.option1,
      body.option2,
      body.option3
    );

    const sql = `
      INSERT INTO product_variants (
        product_id, title, price, compare_at_price, sku, barcode,
        option1, option2, option3,
        position, inventory_quantity, inventory_policy, inventory_management,
        weight, weight_unit, requires_shipping, taxable,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now())
      RETURNING *
    `;

    const variant = await queryOne<ProductVariant>(sql, [
      productId,
      variantTitle,
      body.price || '0.00',
      body.compare_at_price || null,
      body.sku || null,
      body.barcode || null,
      body.option1 || null,
      body.option2 || null,
      body.option3 || null,
      (maxPosition?.max || 0) + 1,
      body.inventory_quantity || 0,
      body.inventory_policy || 'deny',
      body.inventory_management || null,
      body.weight || null,
      body.weight_unit || 'kg',
      body.requires_shipping !== false,
      body.taxable !== false,
    ]);

    if (!variant) {
      throw new Error('Failed to create variant');
    }

    // Emit variant.created event
    await eventBus.emitEvent('variant.created', { variant }, {
      store_id: product.store_id,
      source: 'api',
    });

    return NextResponse.json(quickshopItem('variant', variant), { status: 201 });
  } catch (error: any) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}

