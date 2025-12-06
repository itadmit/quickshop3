import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Product } from '@/types/product';
import { eventBus } from '@/lib/events/eventBus';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/products/import - Import products from CSV
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storeId = user.store_id;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['name', 'price'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const imported: Array<{ id: string; name: string }> = [];
    const errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const name = row.name;
        const price = parseFloat(row.price);

        if (!name || isNaN(price)) {
          errors.push(`Row ${i + 1}: Invalid name or price`);
          continue;
        }

        // Generate unique slug
        const handle = await generateUniqueSlug(name, 'products', storeId);

        // Create product
        const sql = `
          INSERT INTO products (
            store_id, title, handle, body_html, vendor, product_type,
            status, published_scope, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
          RETURNING *
        `;

        const product = await queryOne<Product>(sql, [
          storeId,
          name,
          handle,
          row.description || null,
          row.vendor || null,
          row.product_type || null,
          row.status === 'active' ? 'active' : 'draft',
          'web',
        ]);

        if (product) {
          // Create default variant with price
          await query(
            `INSERT INTO product_variants (
              product_id, title, price, position, inventory_quantity,
              inventory_policy, weight_unit, requires_shipping, taxable,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
            [
              product.id,
              'Default Title',
              price.toString(),
              1,
              parseInt(row.inventoryqty || '0') || 0,
              'deny',
              'kg',
              true,
              row.taxenabled !== 'false',
            ]
          );

          // Emit product.created event
          await eventBus.emitEvent('product.created', { product }, {
            store_id: storeId,
            source: 'api',
          });

          imported.push({ id: product.id.toString(), name: product.title });
        } else {
          errors.push(`Row ${i + 1}: Failed to create product`);
        }
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      errors: errors.length,
      errorDetails: errors,
      products: imported,
    });
  } catch (error: any) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import products' },
      { status: 500 }
    );
  }
}

