import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// POST /api/inventory/import - Import inventory from CSV
// This updates existing inventory levels - very clear and organized
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const updateMode = formData.get('update_mode') as string || 'replace'; // 'replace' or 'add'
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

    // Parse header - remove BOM if present
    let headerLine = lines[0];
    if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.slice(1);
    }
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, '').replace(/\uFEFF/g, ''));
    
    // Map common header variations
    const headerMap: Record<string, string> = {
      'product id': 'product_id',
      'product_id': 'product_id',
      'productid': 'product_id',
      'מוצר id': 'product_id',
      'variant id': 'variant_id',
      'variant_id': 'variant_id',
      'variantid': 'variant_id',
      'sku': 'sku',
      'מקט': 'sku',
      'barcode': 'barcode',
      'ברקוד': 'barcode',
      'available': 'available',
      'זמין': 'available',
      'quantity': 'available',
      'כמות': 'available',
      'committed': 'committed',
      'שמור': 'committed',
      'location id': 'location_id',
      'location_id': 'location_id',
      'locationid': 'location_id',
    };

    const normalizedHeaders = headers.map(h => {
      const cleaned = h.trim().toLowerCase();
      return headerMap[cleaned] || cleaned;
    });
    
    // Must have at least one identifier and available quantity
    const hasProductId = normalizedHeaders.includes('product_id');
    const hasVariantId = normalizedHeaders.includes('variant_id');
    const hasSku = normalizedHeaders.includes('sku');
    const hasBarcode = normalizedHeaders.includes('barcode');
    const hasAvailable = normalizedHeaders.includes('available');

    if (!hasAvailable) {
      return NextResponse.json(
        { error: 'Missing required field: available (or quantity)' },
        { status: 400 }
      );
    }

    if (!hasProductId && !hasVariantId && !hasSku && !hasBarcode) {
      return NextResponse.json(
        { error: 'Must provide at least one identifier: product_id, variant_id, sku, or barcode' },
        { status: 400 }
      );
    }

    const updated: Array<{ variant_id: number; product_title: string; old_available: number; new_available: number }> = [];
    const created: Array<{ variant_id: number; product_title: string; available: number }> = [];
    const errors: Array<{ row: number; error: string }> = [];
    const skipped: Array<{ row: number; reason: string }> = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parse CSV line (handle quoted values)
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            currentValue += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length !== headers.length) {
        errors.push({ row: i + 1, error: `Column count mismatch (expected ${headers.length}, got ${values.length})` });
        continue;
      }

      const row: Record<string, string> = {};
      normalizedHeaders.forEach((header, index) => {
        // Remove quotes and trim
        let value = (values[index] || '').trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        row[header] = value;
      });

      try {
        // Find variant by identifier
        // Priority: variant_id > sku > barcode > product_id
        let variantId: number | null = null;
        let variantInfo: { id: number; product_title: string; current_available: number } | null = null;

        if (row.variant_id) {
          // Direct variant ID lookup
          const variantIdNum = parseInt(row.variant_id);
          if (isNaN(variantIdNum)) {
            errors.push({ row: i + 1, error: `Invalid variant_id: ${row.variant_id}` });
            continue;
          }
          const variant = await queryOne<{ id: number; product_title: string }>(
            `SELECT pv.id, p.title as product_title
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.id = $1 AND p.store_id = $2`,
            [variantIdNum, storeId]
          );
          if (variant) {
            variantId = variant.id;
            // Get inventory from product_variants.inventory_quantity (primary source)
            const variantData = await queryOne<{ inventory_quantity: number }>(
              'SELECT inventory_quantity FROM product_variants WHERE id = $1',
              [variant.id]
            );
            variantInfo = {
              id: variant.id,
              product_title: variant.product_title,
              current_available: variantData?.inventory_quantity || 0,
            };
          }
        } else if (row.sku) {
          // SKU lookup
          const variant = await queryOne<{ id: number; product_title: string }>(
            `SELECT pv.id, p.title as product_title
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.sku = $1 AND p.store_id = $2`,
            [row.sku, storeId]
          );
          if (variant) {
            variantId = variant.id;
            // Get inventory from product_variants.inventory_quantity (primary source)
            const variantData = await queryOne<{ inventory_quantity: number }>(
              'SELECT inventory_quantity FROM product_variants WHERE id = $1',
              [variant.id]
            );
            variantInfo = {
              id: variant.id,
              product_title: variant.product_title,
              current_available: variantData?.inventory_quantity || 0,
            };
          }
        } else if (row.barcode) {
          // Barcode lookup
          const variant = await queryOne<{ id: number; product_title: string }>(
            `SELECT pv.id, p.title as product_title
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.barcode = $1 AND p.store_id = $2`,
            [row.barcode, storeId]
          );
          if (variant) {
            variantId = variant.id;
            // Get inventory from product_variants.inventory_quantity (primary source)
            const variantData = await queryOne<{ inventory_quantity: number }>(
              'SELECT inventory_quantity FROM product_variants WHERE id = $1',
              [variant.id]
            );
            variantInfo = {
              id: variant.id,
              product_title: variant.product_title,
              current_available: variantData?.inventory_quantity || 0,
            };
          }
        } else if (row.product_id) {
          // Product ID lookup - find first variant of the product (fallback for single variant products)
          const productIdNum = parseInt(row.product_id);
          if (isNaN(productIdNum)) {
            errors.push({ row: i + 1, error: `Invalid product_id: ${row.product_id}` });
            continue;
          }
          // Find first variant of the product (for single variant products)
          const variant = await queryOne<{ id: number; product_title: string }>(
            `SELECT pv.id, p.title as product_title
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE p.id = $1 AND p.store_id = $2
             ORDER BY pv.position ASC
             LIMIT 1`,
            [productIdNum, storeId]
          );
          if (variant) {
            variantId = variant.id;
            // Get inventory from product_variants.inventory_quantity (primary source)
            const variantData = await queryOne<{ inventory_quantity: number }>(
              'SELECT inventory_quantity FROM product_variants WHERE id = $1',
              [variant.id]
            );
            variantInfo = {
              id: variant.id,
              product_title: variant.product_title,
              current_available: variantData?.inventory_quantity || 0,
            };
          }
        }

        if (!variantId || !variantInfo) {
          skipped.push({
            row: i + 1,
            reason: `Variant not found (${row.product_id ? `Product ID: ${row.product_id}` : row.variant_id ? `Variant ID: ${row.variant_id}` : row.sku ? `SKU: ${row.sku}` : `Barcode: ${row.barcode}`})`,
          });
          continue;
        }

        // Parse available quantity
        const availableStr = row.available?.trim();
        if (!availableStr) {
          errors.push({ row: i + 1, error: 'Available quantity is required' });
          continue;
        }

        const available = parseInt(availableStr);
        if (isNaN(available) || available < 0) {
          errors.push({ row: i + 1, error: `Invalid available quantity: ${availableStr}` });
          continue;
        }

        // Parse committed (optional)
        const committed = row.committed ? parseInt(row.committed) : null;
        if (committed !== null && (isNaN(committed) || committed < 0)) {
          errors.push({ row: i + 1, error: `Invalid committed quantity: ${row.committed}` });
          continue;
        }

        // Parse location_id (optional)
        const locationId = row.location_id ? (() => {
          const parsed = parseInt(row.location_id);
          return isNaN(parsed) ? null : parsed;
        })() : null;

        // Get current inventory from product_variants (primary source)
        const currentVariant = await queryOne<{ inventory_quantity: number }>(
          'SELECT inventory_quantity FROM product_variants WHERE id = $1',
          [variantId]
        );
        const currentAvailable = currentVariant?.inventory_quantity || 0;

        // Check if variant_inventory record exists (for committed/location tracking)
        const existingInventory = await queryOne<{ id: number; available: number }>(
          'SELECT id, available FROM variant_inventory WHERE variant_id = $1',
          [variantId]
        );

        // Calculate new available quantity
        let newAvailable: number;
        if (updateMode === 'add') {
          // Add to existing quantity
          newAvailable = currentAvailable + available;
        } else {
          // Replace with new quantity
          newAvailable = available;
        }

        // Update product_variants.inventory_quantity (primary inventory)
        const updateResult = await query(
          `UPDATE product_variants SET
            inventory_quantity = $1,
            updated_at = now()
          WHERE id = $2
          RETURNING id, inventory_quantity`,
          [newAvailable, variantId]
        );

        // Verify update
        if (!updateResult || updateResult.length === 0) {
          errors.push({ row: i + 1, error: `Failed to update variant ${variantId}` });
          continue;
        }

        // Save inventory history to system_logs (always create history for imports, even if no change)
        const change = newAvailable - currentAvailable;
        // Always create history entry for imports, even if quantity didn't change
        const contextData = {
          variant_id: variantId,
          old_quantity: currentAvailable,
          new_quantity: newAvailable,
          change: change,
          reason: 'csv_import',
          user_id: user.id,
        };
        
        await query(
          `INSERT INTO system_logs (store_id, level, source, message, context)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [
            storeId,
            'info',
            'inventory',
            `ייבוא מלאי: ${change > 0 ? '+' : ''}${change} יחידות (${currentAvailable} → ${newAvailable})`,
            JSON.stringify(contextData)
          ]
        );

        // Emit inventory.updated event
        await eventBus.emitEvent('inventory.updated', {
          variant_id: variantId,
          quantity: newAvailable,
          old_quantity: currentAvailable,
          change: change,
          reason: 'csv_import',
        }, {
          store_id: storeId,
          source: 'inventory',
          user_id: user.id,
        });

        // Update or create variant_inventory record
        if (existingInventory) {
          // Update existing inventory
          const updateFields: string[] = ['available = $1'];
          const updateParams: any[] = [newAvailable];
          let paramIndex = 2;

          if (committed !== null) {
            updateFields.push(`committed = $${paramIndex}`);
            updateParams.push(committed);
            paramIndex++;
          }

          if (locationId !== null) {
            updateFields.push(`location_id = $${paramIndex}`);
            updateParams.push(locationId);
            paramIndex++;
          }

          updateFields.push('updated_at = now()');
          updateParams.push(variantId);

          await query(
            `UPDATE variant_inventory SET
              ${updateFields.join(', ')}
            WHERE variant_id = $${paramIndex}`,
            updateParams
          );

          updated.push({
            variant_id: variantId,
            product_title: variantInfo.product_title,
            old_available: currentAvailable,
            new_available: newAvailable,
          });
        } else {
          // Create new inventory record
          await query(
            `INSERT INTO variant_inventory (
              variant_id, available, committed, location_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, now(), now())`,
            [variantId, newAvailable, committed || 0, locationId]
          );

          created.push({
            variant_id: variantId,
            product_title: variantInfo.product_title,
            available: newAvailable,
          });
        }
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message || 'Unknown error' });
      }
    }

    return NextResponse.json({
      updated: updated.length,
      created: created.length,
      errors: errors.length,
      skipped: skipped.length,
      errorDetails: errors,
      skippedDetails: skipped,
      summary: {
        total_processed: updated.length + created.length + errors.length + skipped.length,
        successful: updated.length + created.length,
        failed: errors.length,
        skipped: skipped.length,
      },
      updated_items: updated,
      created_items: created,
    });
  } catch (error: any) {
    console.error('Error importing inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import inventory' },
      { status: 500 }
    );
  }
}

