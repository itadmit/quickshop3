import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Contact, ContactWithDetails, ContactCategory, CreateContactRequest } from '@/types/contact';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/contacts - List all contacts with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const categoryType = searchParams.get('categoryType'); // CUSTOMER, CLUB_MEMBER, NEWSLETTER, CONTACT_FORM
    const emailMarketingConsent = searchParams.get('emailMarketingConsent'); // true, false
    const tag = searchParams.get('tag');
    const minOrders = searchParams.get('min_orders');
    const maxOrders = searchParams.get('max_orders');
    const minTotalSpent = searchParams.get('min_total_spent');
    const maxTotalSpent = searchParams.get('max_total_spent');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');
    const hasCustomer = searchParams.get('has_customer'); // true, false

    // Build WHERE clause with LEFT JOIN for customer data
    // Only join orders if we need aggregation filters
    const needsAggregation = minOrders || maxOrders || minTotalSpent || maxTotalSpent;
    
    let sql = `
      SELECT DISTINCT c.*
      FROM contacts c
      ${needsAggregation ? `LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN orders o ON o.customer_id = cust.id` : ''}
      WHERE c.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    // Category filter
    if (categoryType && categoryType !== 'all') {
      sql += ` AND EXISTS (
        SELECT 1 FROM contact_category_assignments cca
        JOIN contact_categories cc ON cca.category_id = cc.id
        WHERE cca.contact_id = c.id
        AND cc.type = $${paramIndex}
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

    // Search filter
    if (search) {
      sql += ` AND (
        c.email ILIKE $${paramIndex} OR 
        c.first_name ILIKE $${paramIndex} OR 
        c.last_name ILIKE $${paramIndex} OR
        c.phone ILIKE $${paramIndex} OR
        c.company ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Tag filter
    if (tag) {
      sql += ` AND $${paramIndex} = ANY(c.tags)`;
      params.push(tag);
      paramIndex++;
    }

    // Has customer filter
    if (hasCustomer === 'true') {
      sql += ` AND c.customer_id IS NOT NULL`;
    } else if (hasCustomer === 'false') {
      sql += ` AND c.customer_id IS NULL`;
    }

    // Created date filters
    if (createdAfter) {
      sql += ` AND c.created_at >= $${paramIndex}`;
      params.push(createdAfter);
      paramIndex++;
    }

    if (createdBefore) {
      sql += ` AND c.created_at <= $${paramIndex}`;
      params.push(createdBefore);
      paramIndex++;
    }

    // Group by for aggregation filters
    if (minOrders || maxOrders || minTotalSpent || maxTotalSpent) {
      sql += ` GROUP BY c.id`;
      
      // Having clause for aggregated filters
      const havingConditions: string[] = [];
      
      if (minOrders) {
        havingConditions.push(`COUNT(DISTINCT o.id) >= $${paramIndex}`);
        params.push(parseInt(minOrders));
        paramIndex++;
      }
      
      if (maxOrders) {
        havingConditions.push(`COUNT(DISTINCT o.id) <= $${paramIndex}`);
        params.push(parseInt(maxOrders));
        paramIndex++;
      }
      
      if (minTotalSpent) {
        havingConditions.push(`COALESCE(SUM(o.total_price::numeric), 0) >= $${paramIndex}`);
        params.push(parseFloat(minTotalSpent));
        paramIndex++;
      }
      
      if (maxTotalSpent) {
        havingConditions.push(`COALESCE(SUM(o.total_price::numeric), 0) <= $${paramIndex}`);
        params.push(parseFloat(maxTotalSpent));
        paramIndex++;
      }
      
      if (havingConditions.length > 0) {
        sql += ` HAVING ${havingConditions.join(' AND ')}`;
      }
    }

    // Get total count for pagination (reuse same filters)
    const countNeedsAggregation = minOrders || maxOrders || minTotalSpent || maxTotalSpent;
    let countSql = `
      SELECT COUNT(DISTINCT c.id) as total 
      FROM contacts c
      ${countNeedsAggregation ? `LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN orders o ON o.customer_id = cust.id` : ''}
      WHERE c.store_id = $1
    `;
    const countParams: any[] = [storeId];
    let countParamIndex = 2;

    if (categoryType && categoryType !== 'all') {
      countSql += ` AND EXISTS (
        SELECT 1 FROM contact_category_assignments cca
        JOIN contact_categories cc ON cca.category_id = cc.id
        WHERE cca.contact_id = c.id
        AND cc.type = $${countParamIndex}
      )`;
      countParams.push(categoryType);
      countParamIndex++;
    }

    if (emailMarketingConsent === 'true' || emailMarketingConsent === 'false') {
      countSql += ` AND c.email_marketing_consent = $${countParamIndex}`;
      countParams.push(emailMarketingConsent === 'true');
      countParamIndex++;
    }

    if (search) {
      countSql += ` AND (
        c.email ILIKE $${countParamIndex} OR 
        c.first_name ILIKE $${countParamIndex} OR 
        c.last_name ILIKE $${countParamIndex} OR
        c.phone ILIKE $${countParamIndex} OR
        c.company ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (tag) {
      countSql += ` AND $${countParamIndex} = ANY(c.tags)`;
      countParams.push(tag);
      countParamIndex++;
    }

    if (hasCustomer === 'true') {
      countSql += ` AND c.customer_id IS NOT NULL`;
    } else if (hasCustomer === 'false') {
      countSql += ` AND c.customer_id IS NULL`;
    }

    if (createdAfter) {
      countSql += ` AND c.created_at >= $${countParamIndex}`;
      countParams.push(createdAfter);
      countParamIndex++;
    }

    if (createdBefore) {
      countSql += ` AND c.created_at <= $${countParamIndex}`;
      countParams.push(createdBefore);
      countParamIndex++;
    }

    if (minOrders || maxOrders || minTotalSpent || maxTotalSpent) {
      countSql += ` GROUP BY c.id`;
      
      const havingConditions: string[] = [];
      
      if (minOrders) {
        havingConditions.push(`COUNT(DISTINCT o.id) >= $${countParamIndex}`);
        countParams.push(parseInt(minOrders));
        countParamIndex++;
      }
      
      if (maxOrders) {
        havingConditions.push(`COUNT(DISTINCT o.id) <= $${countParamIndex}`);
        countParams.push(parseInt(maxOrders));
        countParamIndex++;
      }
      
      if (minTotalSpent) {
        havingConditions.push(`COALESCE(SUM(o.total_price::numeric), 0) >= $${countParamIndex}`);
        countParams.push(parseFloat(minTotalSpent));
        countParamIndex++;
      }
      
      if (maxTotalSpent) {
        havingConditions.push(`COALESCE(SUM(o.total_price::numeric), 0) <= $${countParamIndex}`);
        countParams.push(parseFloat(maxTotalSpent));
        countParamIndex++;
      }
      
      if (havingConditions.length > 0) {
        countSql += ` HAVING ${havingConditions.join(' AND ')}`;
      }
      
      // For count with GROUP BY, we need to count the groups
      countSql = `SELECT COUNT(*) as total FROM (${countSql}) as filtered_contacts`;
    }

    const totalResult = await queryOne<{ total: string }>(countSql, countParams);
    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    sql += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const contacts = await query<Contact>(sql, params);

    // Get category assignments and customer info for each contact
    const contactsWithDetails: ContactWithDetails[] = await Promise.all(
      contacts.map(async (contact) => {
        const [categoryAssignments, customerData] = await Promise.all([
          query<{ id: number; category: ContactCategory }>(
            `SELECT 
              cca.id,
              json_build_object(
                'id', cc.id,
                'store_id', cc.store_id,
                'type', cc.type,
                'name', cc.name,
                'color', cc.color,
                'created_at', cc.created_at,
                'updated_at', cc.updated_at
              ) as category
            FROM contact_category_assignments cca
            JOIN contact_categories cc ON cca.category_id = cc.id
            WHERE cca.contact_id = $1`,
            [contact.id]
          ),
          contact.customer_id ? queryOne<{ total_spent: string; orders_count: number }>(
            `SELECT 
              COALESCE(SUM(o.total_price::numeric), 0) as total_spent,
              COUNT(DISTINCT o.id) as orders_count
            FROM orders o
            WHERE o.customer_id = $1`,
            [contact.customer_id]
          ) : Promise.resolve(null),
        ]);

        return {
          ...contact,
          category_assignments: categoryAssignments.map((ca: any) => ({
            id: ca.id,
            category: ca.category,
          })),
          customer: customerData ? {
            id: contact.customer_id!,
            total_spent: customerData.total_spent,
            orders_count: customerData.orders_count,
          } : undefined,
        };
      })
    );

    return NextResponse.json({
      contacts: contactsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    const body: CreateContactRequest & { storeId?: number } = await request.json();
    
    // Get storeId from body (for storefront) or from user (for dashboard)
    let storeId: number;
    let user: any = null;
    
    if (body.storeId) {
      // Storefront submission - use storeId from body
      storeId = body.storeId;
    } else {
      // Dashboard submission - require authentication
      user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      storeId = user.store_id;
    }

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if contact already exists
    const existingContact = await queryOne<Contact>(
      'SELECT * FROM contacts WHERE store_id = $1 AND email = $2',
      [storeId, body.email]
    );

    // If exists, update instead of creating duplicate
    if (existingContact) {
      // Update existing contact
      const updatedContact = await queryOne<Contact>(
        `UPDATE contacts 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             company = COALESCE($4, company),
             notes = COALESCE($5, notes),
             tags = COALESCE($6, tags),
             email_marketing_consent = COALESCE($7, email_marketing_consent),
             email_marketing_consent_at = CASE WHEN $7 = true AND email_marketing_consent = false THEN now() ELSE email_marketing_consent_at END,
             updated_at = now()
         WHERE id = $8
         RETURNING *`,
        [
          body.first_name || null,
          body.last_name || null,
          body.phone || null,
          body.company || null,
          body.notes || null,
          body.tags || null,
          body.email_marketing_consent !== undefined ? body.email_marketing_consent : null,
          existingContact.id,
        ]
      );

      // Update category assignments if provided
      if (body.category_types && body.category_types.length > 0) {
        // Get category IDs
        const categories = await query<{ id: number }>(
          'SELECT id FROM contact_categories WHERE store_id = $1 AND type = ANY($2::text[])',
          [storeId, body.category_types]
        );

        // Remove existing assignments
        await query(
          'DELETE FROM contact_category_assignments WHERE contact_id = $1',
          [existingContact.id]
        );

        // Add new assignments
        for (const category of categories) {
          await query(
            'INSERT INTO contact_category_assignments (contact_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [existingContact.id, category.id]
          );
        }
      }

      // Emit event
      await eventBus.emitEvent('contact.updated', {
        contact: {
          id: updatedContact!.id,
          email: updatedContact!.email,
        },
      }, {
        store_id: storeId,
        source: 'api',
        user_id: user.id,
      });

      return NextResponse.json({ contact: updatedContact }, { status: 200 });
    }

    // Create new contact
    const contactResult = await queryOne<Contact>(
      `INSERT INTO contacts (
        store_id, email, first_name, last_name, phone, company,
        notes, tags, email_marketing_consent, email_marketing_consent_at,
        source, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 
        CASE WHEN $9 = true THEN now() ELSE NULL END,
        $10, now(), now()
      ) RETURNING *`,
      [
        storeId,
        body.email,
        body.first_name || null,
        body.last_name || null,
        body.phone || null,
        body.company || null,
        body.notes || null,
        body.tags || null,
        body.email_marketing_consent || false,
        body.source || 'manual',
      ]
    );

    if (!contactResult) {
      throw new Error('Failed to create contact');
    }

    // Add category assignments if provided
    if (body.category_types && body.category_types.length > 0) {
      const categories = await query<{ id: number }>(
        'SELECT id FROM contact_categories WHERE store_id = $1 AND type = ANY($2::text[])',
        [storeId, body.category_types]
      );

      for (const category of categories) {
        await query(
          'INSERT INTO contact_category_assignments (contact_id, category_id) VALUES ($1, $2)',
          [contactResult.id, category.id]
        );
      }
    }

    // Emit event
    await eventBus.emitEvent('contact.created', {
      contact: {
        id: contactResult.id,
        email: contactResult.email,
        first_name: contactResult.first_name,
        last_name: contactResult.last_name,
      },
    }, {
      store_id: storeId,
      source: body.storeId ? 'storefront' : 'api',
      user_id: user?.id || null,
    });

    return NextResponse.json({ contact: contactResult }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create contact' },
      { status: 500 }
    );
  }
}

