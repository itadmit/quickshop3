import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/settings/email - Get SendGrid settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get SendGrid settings from integrations table
    const integration = await queryOne<{
      id: number;
      settings: any;
    }>(
      `SELECT id, settings FROM integrations 
       WHERE integration_type = 'email' 
       AND provider_name = 'sendgrid'
       LIMIT 1`
    );

    if (!integration || !integration.settings) {
      return NextResponse.json({
        configured: false,
        settings: null,
      });
    }

    const sendgridSettings = integration.settings as any;
    
    return NextResponse.json({
      configured: !!sendgridSettings.apiKey,
      settings: {
        apiKey: sendgridSettings.apiKey ? '***' : null, // Don't return the actual key
        fromEmail: sendgridSettings.fromEmail || 'no-reply@my-quickshop.com',
        fromName: sendgridSettings.fromName || 'Quick Shop',
      },
    });
  } catch (error: any) {
    console.error('Error fetching SendGrid settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch SendGrid settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/email - Save/Update SendGrid settings
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey, fromEmail, fromName } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Check if integration already exists
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM integrations 
       WHERE integration_type = 'email' 
       AND provider_name = 'sendgrid'
       LIMIT 1`
    );

    if (existing) {
      // Update existing
      await query(
        `UPDATE integrations 
         SET settings = $1, is_active = true, updated_at = now()
         WHERE id = $2`,
        [
          JSON.stringify({
            apiKey,
            fromEmail: fromEmail || 'no-reply@my-quickshop.com',
            fromName: fromName || 'Quick Shop',
          }),
          existing.id,
        ]
      );
    } else {
      // Create new
      await query(
        `INSERT INTO integrations (integration_type, provider_name, is_active, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())`,
        [
          'email',
          'sendgrid',
          true,
          JSON.stringify({
            apiKey,
            fromEmail: fromEmail || 'no-reply@my-quickshop.com',
            fromName: fromName || 'Quick Shop',
          }),
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SendGrid settings saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving SendGrid settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save SendGrid settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/email - Delete SendGrid settings
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await query(
      `UPDATE integrations 
       SET is_active = false, updated_at = now()
       WHERE integration_type = 'email' 
       AND provider_name = 'sendgrid'`
    );

    return NextResponse.json({
      success: true,
      message: 'SendGrid settings deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting SendGrid settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete SendGrid settings' },
      { status: 500 }
    );
  }
}

