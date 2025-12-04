import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/customers/:id/tags - Get all tags for a customer
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify customer belongs to store
    const customer = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM customers WHERE id = $1',
      [customerId]
    );

    if (!customer || customer.store_id !== storeId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get tags
    const tags = await query<{ tag_name: string }>(
      'SELECT tag_name FROM customer_tag_map WHERE customer_id = $1 ORDER BY tag_name',
      [customerId]
    );

    return NextResponse.json({ 
      tags: tags.map(t => t.tag_name) 
    });
  } catch (error: any) {
    console.error('Error fetching customer tags:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer tags' },
      { status: 500 }
    );
  }
}

// POST /api/customers/:id/tags - Add tag to customer
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
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const body = await request.json();
    const { tag_name } = body;

    if (!tag_name || !tag_name.trim()) {
      return NextResponse.json({ error: 'tag_name is required' }, { status: 400 });
    }

    const storeId = user.store_id;
    const tagName = tag_name.trim();

    // Verify customer belongs to store
    const customer = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM customers WHERE id = $1',
      [customerId]
    );

    if (!customer || customer.store_id !== storeId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if tag already exists
    const existing = await queryOne<{ customer_id: number }>(
      'SELECT customer_id FROM customer_tag_map WHERE customer_id = $1 AND tag_name = $2',
      [customerId, tagName]
    );

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tag already added to customer' 
      });
    }

    // Add tag to customer
    await query(
      'INSERT INTO customer_tag_map (customer_id, tag_name) VALUES ($1, $2)',
      [customerId, tagName]
    );

    // Update customer.tags field (comma-separated for backward compatibility)
    const allTags = await query<{ tag_name: string }>(
      'SELECT tag_name FROM customer_tag_map WHERE customer_id = $1 ORDER BY tag_name',
      [customerId]
    );
    const tagsString = allTags.map(t => t.tag_name).join(', ');
    await query(
      'UPDATE customers SET tags = $1, updated_at = now() WHERE id = $2',
      [tagsString || null, customerId]
    );

    // Emit event
    await eventBus.emitEvent('customer.tag.added', {
      customer_id: customerId,
      tag_name: tagName,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Tag added to customer successfully' 
    });
  } catch (error: any) {
    console.error('Error adding tag to customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add tag to customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/:id/tags - Remove tag from customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customerId = parseInt(id);
    
    // Get tag name from query string or body
    const url = new URL(request.url);
    const tagNameParam = url.searchParams.get('tag_name') || (await request.json()).tag_name;
    const tagName = tagNameParam ? decodeURIComponent(tagNameParam) : null;

    if (isNaN(customerId) || !tagName) {
      return NextResponse.json({ error: 'Invalid customer ID or tag name' }, { status: 400 });
    }

    const storeId = user.store_id;

    // Verify customer belongs to store
    const customer = await queryOne<{ id: number; store_id: number }>(
      'SELECT id, store_id FROM customers WHERE id = $1',
      [customerId]
    );

    if (!customer || customer.store_id !== storeId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Remove tag from customer
    await query(
      'DELETE FROM customer_tag_map WHERE customer_id = $1 AND tag_name = $2',
      [customerId, tagName]
    );

    // Update customer.tags field
    const allTags = await query<{ tag_name: string }>(
      'SELECT tag_name FROM customer_tag_map WHERE customer_id = $1 ORDER BY tag_name',
      [customerId]
    );
    const tagsString = allTags.map(t => t.tag_name).join(', ');
    await query(
      'UPDATE customers SET tags = $1, updated_at = now() WHERE id = $2',
      [tagsString || null, customerId]
    );

    // Emit event
    await eventBus.emitEvent('customer.tag.removed', {
      customer_id: customerId,
      tag_name: tagName,
    }, {
      store_id: storeId,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Tag removed from customer successfully' 
    });
  } catch (error: any) {
    console.error('Error removing tag from customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove tag from customer' },
      { status: 500 }
    );
  }
}

