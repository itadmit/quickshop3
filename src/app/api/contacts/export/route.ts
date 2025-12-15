import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Contact } from '@/types/contact';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/contacts/export - Export contacts to CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const searchParams = request.nextUrl.searchParams;
    
    // Optional filters
    const categoryType = searchParams.get('categoryType');
    const emailMarketingConsent = searchParams.get('emailMarketingConsent');
    const tag = searchParams.get('tag');

    // Build query with filters
    let sql = `
      SELECT c.*,
        array_agg(DISTINCT cc.name) FILTER (WHERE cc.name IS NOT NULL) as category_names
      FROM contacts c
      LEFT JOIN contact_category_assignments cca ON cca.contact_id = c.id
      LEFT JOIN contact_categories cc ON cca.category_id = cc.id
      WHERE c.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    // Category filter
    if (categoryType && categoryType !== 'all') {
      sql += ` AND EXISTS (
        SELECT 1 FROM contact_category_assignments cca2
        JOIN contact_categories cc2 ON cca2.category_id = cc2.id
        WHERE cca2.contact_id = c.id
        AND cc2.type = $${paramIndex}
      )`;
      params.push(categoryType);
      paramIndex++;
    }

    // Email marketing consent filter
    if (emailMarketingConsent === 'true' || emailMarketingConsent === 'false') {
      sql += ` AND c.email_marketing_consent = $${paramIndex}`;
      params.push(emailMarketingConsent === 'true');
      paramIndex++;
    }

    // Tag filter
    if (tag) {
      sql += ` AND $${paramIndex} = ANY(c.tags)`;
      params.push(tag);
      paramIndex++;
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;

    const contacts = await query<Contact & { category_names: string[] | null }>(sql, params);

    // Build CSV content
    const headers = [
      'אימייל',
      'שם פרטי',
      'שם משפחה',
      'טלפון',
      'חברה',
      'הערות',
      'תגיות',
      'אישור דיוור',
      'קטגוריות',
      'תאריך הצטרפות',
    ];

    const rows = contacts.map(contact => {
      return [
        escapeCSV(contact.email),
        escapeCSV(contact.first_name || ''),
        escapeCSV(contact.last_name || ''),
        escapeCSV(contact.phone || ''),
        escapeCSV(contact.company || ''),
        escapeCSV(contact.notes || ''),
        escapeCSV((contact.tags || []).join('; ')),
        contact.email_marketing_consent ? 'כן' : 'לא',
        escapeCSV((contact.category_names || []).join('; ')),
        new Date(contact.created_at).toLocaleDateString('he-IL'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Add BOM for Hebrew support in Excel
    const bom = '\ufeff';
    const csvWithBom = bom + csvContent;

    // Return CSV file
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contacts_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export contacts' },
      { status: 500 }
    );
  }
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return '';
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

