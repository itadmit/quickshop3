import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { eventBus } from '@/lib/events/eventBus';
// Initialize event listeners
import '@/lib/events/listeners';

// DELETE /api/settings/api-keys/:id - Delete API key
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
    const keyId = parseInt(id);

    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid API key ID' }, { status: 400 });
    }

    // Verify key belongs to store
    const apiKey = await queryOne<{ id: number; name: string }>(
      'SELECT id, name FROM api_keys WHERE id = $1 AND store_id = $2',
      [keyId, user.store_id]
    );

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Delete API key
    await query(
      'DELETE FROM api_keys WHERE id = $1 AND store_id = $2',
      [keyId, user.store_id]
    );

    // Emit event
    await eventBus.emitEvent('api_key.deleted', {
      api_key_id: keyId,
      name: apiKey.name,
    }, {
      store_id: user.store_id,
      source: 'api',
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

