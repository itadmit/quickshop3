import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Contact } from '@/types/contact';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/contacts/import - Import contacts from CSV
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

    // Parse header - support both English and Hebrew headers
    const headerMap: Record<string, string> = {
      // English
      'email': 'email',
      'first_name': 'first_name',
      'firstname': 'first_name',
      'last_name': 'last_name',
      'lastname': 'last_name',
      'phone': 'phone',
      'company': 'company',
      'notes': 'notes',
      'tags': 'tags',
      'email_marketing_consent': 'email_marketing_consent',
      'marketing_consent': 'email_marketing_consent',
      // Hebrew
      'אימייל': 'email',
      'מייל': 'email',
      'שם פרטי': 'first_name',
      'שם משפחה': 'last_name',
      'טלפון': 'phone',
      'חברה': 'company',
      'הערות': 'notes',
      'תגיות': 'tags',
      'אישור דיוור': 'email_marketing_consent',
    };

    const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const headers = rawHeaders.map(h => headerMap[h] || h);
    
    // Check for required email field
    if (!headers.includes('email')) {
      return NextResponse.json(
        { error: 'Missing required field: email (אימייל)' },
        { status: 400 }
      );
    }

    const imported: Array<{ id: number; email: string }> = [];
    const updated: Array<{ id: number; email: string }> = [];
    const errors: string[] = [];

    // Get category IDs for NEWSLETTER (default for imported contacts)
    const newsletterCategory = await queryOne<{ id: number }>(
      'SELECT id FROM contact_categories WHERE store_id = $1 AND type = $2',
      [storeId, 'NEWSLETTER']
    );

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV parsing with quoted values
      const values = parseCSVRow(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push(`שורה ${i + 1}: מספר עמודות לא תואם`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const email = row.email?.trim();

        if (!email || !isValidEmail(email)) {
          errors.push(`שורה ${i + 1}: אימייל לא תקין - ${email || 'ריק'}`);
          continue;
        }

        // Check if contact already exists
        const existingContact = await queryOne<Contact>(
          'SELECT * FROM contacts WHERE store_id = $1 AND email = $2',
          [storeId, email]
        );

        // Parse tags
        const tags = row.tags ? row.tags.split(';').map(t => t.trim()).filter(t => t) : null;
        
        // Parse email marketing consent
        const marketingConsent = parseBoolean(row.email_marketing_consent);

        if (existingContact) {
          // Update existing contact
          await query(
            `UPDATE contacts SET
              first_name = COALESCE($1, first_name),
              last_name = COALESCE($2, last_name),
              phone = COALESCE($3, phone),
              company = COALESCE($4, company),
              notes = COALESCE($5, notes),
              tags = COALESCE($6, tags),
              email_marketing_consent = COALESCE($7, email_marketing_consent),
              updated_at = now()
            WHERE id = $8`,
            [
              row.first_name || null,
              row.last_name || null,
              row.phone || null,
              row.company || null,
              row.notes || null,
              tags,
              marketingConsent,
              existingContact.id,
            ]
          );

          updated.push({ id: existingContact.id, email });
        } else {
          // Create new contact
          const contact = await queryOne<Contact>(
            `INSERT INTO contacts (
              store_id, email, first_name, last_name, phone, company,
              notes, tags, email_marketing_consent, email_marketing_consent_at,
              source, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, 
              CASE WHEN $9 = true THEN now() ELSE NULL END,
              'import', now(), now()
            ) RETURNING *`,
            [
              storeId,
              email,
              row.first_name || null,
              row.last_name || null,
              row.phone || null,
              row.company || null,
              row.notes || null,
              tags,
              marketingConsent || false,
            ]
          );

          if (contact) {
            // Add to NEWSLETTER category by default
            if (newsletterCategory) {
              await query(
                'INSERT INTO contact_category_assignments (contact_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [contact.id, newsletterCategory.id]
              );
            }

            // Emit event
            await eventBus.emitEvent('contact.created', {
              contact: {
                id: contact.id,
                email: contact.email,
              },
            }, {
              store_id: storeId,
              source: 'import',
            });

            imported.push({ id: contact.id, email });
          } else {
            errors.push(`שורה ${i + 1}: שגיאה ביצירת איש קשר`);
          }
        }
      } catch (error: any) {
        errors.push(`שורה ${i + 1}: ${error.message || 'שגיאה לא ידועה'}`);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      updated: updated.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 20), // Limit error details
      contacts: imported,
    });
  } catch (error: any) {
    console.error('Error importing contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import contacts' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV row with quoted values
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to parse boolean values
function parseBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  if (['true', 'yes', '1', 'כן', 'מאושר'].includes(lower)) return true;
  if (['false', 'no', '0', 'לא', 'לא מאושר'].includes(lower)) return false;
  return null;
}

