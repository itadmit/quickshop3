import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { quickshopList, quickshopItem } from '@/lib/utils/apiFormatter';
import crypto from 'crypto';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// GET /api/settings/api-keys - Get API keys for store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if api_keys table exists
    let apiKeys: any[] = [];
    try {
      apiKeys = await query<{
        id: number;
        name: string;
        key_prefix: string;
        created_at: Date;
      }>(
        `SELECT id, name, 
         SUBSTRING(key, 1, 8) as key_prefix,
         created_at
         FROM api_keys
         WHERE store_id = $1
         ORDER BY created_at DESC`,
        [user.store_id]
      );
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(quickshopList('api_keys', []));
      }
      throw error;
    }

    return NextResponse.json(quickshopList('api_keys', apiKeys));
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/settings/api-keys - Create API key
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate API key
    const apiKey = `qsk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Check if api_keys table exists, if not create it
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          store_id INT REFERENCES stores(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          key_hash TEXT NOT NULL UNIQUE,
          key_prefix VARCHAR(8) NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
          last_used_at TIMESTAMP WITHOUT TIME ZONE,
          is_active BOOLEAN DEFAULT true
        )`
      );

      await query(
        `CREATE INDEX IF NOT EXISTS idx_api_keys_store_id ON api_keys(store_id)`
      );
    } catch (error: any) {
      // Ignore if table already exists
      if (!error.message?.includes('already exists')) {
        console.warn('Error creating api_keys table:', error);
      }
    }

    // Insert API key
    const result = await queryOne<{
      id: number;
      name: string;
      key_prefix: string;
      created_at: Date;
    }>(
      `INSERT INTO api_keys (store_id, name, key_hash, key_prefix)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, key_prefix, created_at`,
      [user.store_id, name.trim(), keyHash, apiKey.substring(0, 8)]
    );

    if (!result) {
      throw new Error('Failed to create API key');
    }

    // Emit event
    await eventBus.emitEvent('api_key.created', {
      api_key_id: result.id,
      name: result.name,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    // Return the full key only once (for security)
    return NextResponse.json({
      ...quickshopItem('api_key', result),
      key: apiKey, // Only returned on creation
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}

