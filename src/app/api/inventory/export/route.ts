import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/inventory/export - Export inventory as CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const format = searchParams.get('format') || 'csv';
    const lowStock = searchParams.get('low_stock') === 'true';

    let sql = `
      SELECT 
        pv.id as variant_id,
        p.id as product_id,
        p.title as product_title,
        pv.title as variant_title,
        pv.option1,
        pv.option2,
        pv.option3,
        pv.sku,
        pv.barcode,
        COALESCE(pv.inventory_quantity, 0) as available,
        COALESCE(vi.committed, 0) as committed,
        vi.location_id,
        pv.created_at,
        pv.updated_at
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN variant_inventory vi ON vi.variant_id = pv.id
      WHERE p.store_id = $1
    `;
    const params: any[] = [storeId];

    if (lowStock) {
      sql += ` AND COALESCE(pv.inventory_quantity, 0) < 10`;
    }

    sql += ` ORDER BY p.title, pv.position, pv.title`;

    const inventory = await query<{
      variant_id: number;
      product_id: number;
      product_title: string;
      variant_title: string | null;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      sku: string | null;
      barcode: string | null;
      available: number;
      committed: number;
      location_id: number | null;
      created_at: Date;
      updated_at: Date;
    }>(sql, params);

    if (format === 'json') {
      return NextResponse.json({ inventory }, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV format
    const csvHeaders = [
      'Product ID',
      'Variant ID',
      'Product Title',
      'Variant Title',
      'Option 1',
      'Option 2',
      'Option 3',
      'SKU',
      'Barcode',
      'Available',
      'Committed',
      'Location ID',
      'Created At',
      'Updated At',
    ];

    const csvRows = inventory.map(item => [
      item.product_id.toString(),
      item.variant_id.toString(),
      item.product_title || '',
      item.variant_title || '',
      item.option1 || '',
      item.option2 || '',
      item.option3 || '',
      item.sku || '',
      item.barcode || '',
      item.available.toString(),
      item.committed.toString(),
      item.location_id?.toString() || '',
      new Date(item.created_at).toISOString(),
      new Date(item.updated_at).toISOString(),
    ]);

    // Escape CSV values
    const escapeCsv = (value: string | number | null | undefined) => {
      const str = value?.toString() || '';
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      csvHeaders.map(escapeCsv).join(','),
      ...csvRows.map(row => row.map(escapeCsv).join(',')),
    ].join('\n');

    // Add BOM for Hebrew support in Excel
    const csvWithBom = '\uFEFF' + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export inventory' },
      { status: 500 }
    );
  }
}

