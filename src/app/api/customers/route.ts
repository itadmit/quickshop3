import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { Customer, CustomerWithDetails, CustomerAddress, CustomerNote, CreateCustomerRequest } from '@/types/customer';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/customers - List all customers with filters and cursor pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const storeId = user.store_id;
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor'); // ID of last customer seen
    const search = searchParams.get('search'); // Search by email, name, phone
    
    // Filters
    const state = searchParams.get('state'); // enabled, disabled, invited
    const acceptsMarketing = searchParams.get('accepts_marketing'); // true, false
    const tag = searchParams.get('tag'); // Filter by tag name
    const minOrders = searchParams.get('min_orders'); // Minimum number of orders
    const maxOrders = searchParams.get('max_orders'); // Maximum number of orders
    const minTotalSpent = searchParams.get('min_total_spent'); // Minimum total spent
    const maxTotalSpent = searchParams.get('max_total_spent'); // Maximum total spent
    const createdAfter = searchParams.get('created_after'); // ISO date string
    const createdBefore = searchParams.get('created_before'); // ISO date string

    let sql = `
      SELECT c.*,
             COUNT(DISTINCT o.id) as orders_count,
             COALESCE(SUM(o.total_price::numeric), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.store_id = $1
    `;
    const params: any[] = [storeId];
    let paramIndex = 2;

    // Search filter
    if (search) {
      sql += ` AND (
        c.email ILIKE $${paramIndex} OR 
        c.first_name ILIKE $${paramIndex} OR 
        c.last_name ILIKE $${paramIndex} OR
        c.phone ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // State filter
    if (state) {
      sql += ` AND c.state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    // Accepts marketing filter
    if (acceptsMarketing !== null && acceptsMarketing !== undefined) {
      sql += ` AND c.accepts_marketing = $${paramIndex}`;
      params.push(acceptsMarketing === 'true');
      paramIndex++;
    }

    // Tag filter
    if (tag) {
      sql += ` AND EXISTS (
        SELECT 1 FROM customer_tag_map 
        WHERE customer_id = c.id 
        AND tag_name = $${paramIndex}
      )`;
      params.push(tag);
      paramIndex++;
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

    sql += ` GROUP BY c.id`;

    // Orders count filters (must be after GROUP BY)
    if (minOrders || maxOrders) {
      sql += ` HAVING COUNT(DISTINCT o.id)`;
      if (minOrders) {
        sql += ` >= $${paramIndex}`;
        params.push(parseInt(minOrders));
        paramIndex++;
      }
      if (maxOrders) {
        if (minOrders) {
          sql += ` AND COUNT(DISTINCT o.id)`;
        }
        sql += ` <= $${paramIndex}`;
        params.push(parseInt(maxOrders));
        paramIndex++;
      }
    }

    // Total spent filters (must be after GROUP BY)
    if (minTotalSpent || maxTotalSpent) {
      if (!minOrders && !maxOrders) {
        sql += ` HAVING`;
      } else {
        sql += ` AND`;
      }
      sql += ` COALESCE(SUM(o.total_price::numeric), 0)`;
      if (minTotalSpent) {
        sql += ` >= $${paramIndex}`;
        params.push(parseFloat(minTotalSpent));
        paramIndex++;
      }
      if (maxTotalSpent) {
        if (minTotalSpent) {
          sql += ` AND COALESCE(SUM(o.total_price::numeric), 0)`;
        }
        sql += ` <= $${paramIndex}`;
        params.push(parseFloat(maxTotalSpent));
        paramIndex++;
      }
    }

    // Cursor pagination
    if (cursor) {
      sql += ` AND c.id < $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    sql += ` ORDER BY c.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const customers = await query<Customer & { orders_count: number; total_spent: string }>(sql, params);

    // Get addresses and notes for each customer
    const customersWithDetails: CustomerWithDetails[] = await Promise.all(
      customers.map(async (customer) => {
        const [addresses, notes] = await Promise.all([
          query<CustomerAddress>(
            'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY default_address DESC, created_at DESC',
            [customer.id]
          ),
          query<CustomerNote>(
            'SELECT * FROM customer_notes WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5',
            [customer.id]
          ),
        ]);

        return {
          ...customer,
          addresses,
          notes,
          orders_count: customer.orders_count,
          total_spent: customer.total_spent,
        };
      })
    );

    // Determine if there are more customers
    const hasNextPage = customers.length === limit;
    const nextCursor = hasNextPage && customers.length > 0 ? customers[customers.length - 1].id.toString() : null;

    return NextResponse.json({
      customers: customersWithDetails,
      page_info: {
        has_next_page: hasNextPage,
        cursor: nextCursor,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateCustomerRequest = await request.json();
    const storeId = user.store_id;

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if customer already exists
    const existingCustomer = await queryOne<Customer>(
      'SELECT * FROM customers WHERE store_id = $1 AND email = $2',
      [storeId, body.email]
    );

    if (existingCustomer) {
      return NextResponse.json({ error: 'Customer already exists' }, { status: 400 });
    }

    // Create customer
    const customerResult = await queryOne<Customer>(
      `INSERT INTO customers (
        store_id, email, phone, first_name, last_name,
        accepts_marketing, tags, note, state, verified_email,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now()
      ) RETURNING *`,
      [
        storeId,
        body.email,
        body.phone || null,
        body.first_name || null,
        body.last_name || null,
        body.accepts_marketing || false,
        body.tags ? body.tags.join(',') : null,
        body.note || null,
        'enabled',
        false,
      ]
    );

    if (!customerResult) {
      throw new Error('Failed to create customer');
    }

    // Emit customer.created event
    await eventBus.emitEvent('customer.created', {
      customer: {
        id: customerResult.id,
        email: customerResult.email,
        first_name: customerResult.first_name,
        last_name: customerResult.last_name,
      },
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ customer: customerResult }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}

