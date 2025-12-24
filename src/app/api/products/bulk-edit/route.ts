import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/products/bulk-edit - Get products with variants for bulk editing
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Build WHERE clause
    let sql = `
      SELECT 
        p.id,
        p.title,
        p.handle,
        p.status,
        p.vendor,
        p.body_html,
        p.created_at,
        p.updated_at,
        (SELECT MIN(CAST(price AS DECIMAL)) FROM product_variants WHERE product_id = p.id) as price,
        (SELECT MIN(CAST(compare_at_price AS DECIMAL)) FROM product_variants WHERE product_id = p.id AND compare_at_price IS NOT NULL) as compare_price,
        (SELECT COALESCE(SUM(pv.inventory_quantity), 0) FROM product_variants pv 
         WHERE pv.product_id = p.id) as inventory_qty
      FROM products p
      WHERE p.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    if (ids && ids.length > 0) {
      sql += ` AND p.id = ANY($${paramIndex}::int[])`;
      params.push(ids.map(id => parseInt(id)));
      paramIndex++;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const products = await query(sql, params);

    // Get variants, images, and collections for each product
    const formattedProducts = await Promise.all(
      products.map(async (product: any) => {
        // Get variants with inventory
        const variants = await query(
          `SELECT 
            pv.id,
            pv.title,
            pv.price,
            pv.compare_at_price,
            pv.sku,
            COALESCE(pv.inventory_quantity, 0) as inventory_quantity,
            pv.weight,
            pv.position
          FROM product_variants pv
          WHERE pv.product_id = $1
          ORDER BY pv.position ASC`,
          [product.id]
        );

        // Get cost meta fields for variants
        const costMetaFields = await query(
          `SELECT key, value FROM product_meta_fields 
           WHERE product_id = $1 AND namespace = 'custom' AND key LIKE 'variant_cost%'`,
          [product.id]
        );

        // Get images
        const images = await query(
          `SELECT src, alt, position
          FROM product_images
          WHERE product_id = $1
          ORDER BY position ASC`,
          [product.id]
        );

        // Get collections - כולל תת-קטגוריות (כל הקטגוריות שהמוצר שייך אליהן)
        const collections = await query(
          `SELECT 
            pc.id,
            pc.title,
            pc.handle,
            pc.parent_id
          FROM product_collections pc
          INNER JOIN product_collection_map pcm ON pc.id = pcm.collection_id
          WHERE pcm.product_id = $1
          ORDER BY pc.parent_id NULLS FIRST, pc.title ASC`,
          [product.id]
        );

        // מציאת הקטגוריה הראשית (ללא parent) או הראשונה
        const mainCategory = collections.find((c: any) => !c.parent_id) || collections[0];
        
        // בניית רשימת כל הקטגוריות (כולל תת-קטגוריות)
        const allCategories = collections.map((c: any) => ({
          categoryId: c.id.toString(),
          category: { id: c.id.toString(), name: c.title },
          parentId: c.parent_id ? c.parent_id.toString() : null,
        }));

        return {
          id: product.id.toString(),
          name: product.title,
          sku: null, // Product-level SKU not in schema
          status: product.status,
          price: parseFloat(product.price || '0'),
          comparePrice: product.compare_price ? parseFloat(product.compare_price) : null,
          cost: null, // Cost not in schema
          inventoryQty: parseInt(product.inventory_qty || '0'),
          availability: product.status === 'active' ? 'available' : 'unavailable',
          vendor: product.vendor,
          category: mainCategory?.title || null,
          categories: allCategories,
          images: images.map((img: any) => img.src),
          variants: variants.map((v: any) => {
            // Find cost from meta fields (if exists)
            const costMetaField = costMetaFields.find((mf: any) => mf.key === `variant_cost_${v.id}`);
            const costValue = costMetaField?.value ? parseFloat(costMetaField.value) : null;
            
            return {
              id: v.id.toString(),
              name: v.title,
              sku: v.sku,
              price: parseFloat(v.price || '0'),
              comparePrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
              cost: costValue,
              inventoryQty: v.inventory_quantity,
              weight: v.weight,
              image: images[0]?.src || null,
            };
          }),
        };
      })
    );

    return NextResponse.json({
      products: formattedProducts,
    });
  } catch (error: any) {
    console.error('Error fetching products for bulk edit:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

