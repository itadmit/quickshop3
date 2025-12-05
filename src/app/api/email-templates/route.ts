import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/email-templates - Get all email templates for store
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await query<{
      id: number;
      template_type: string;
      subject: string;
      body_html: string;
      is_active: boolean;
    }>(
      'SELECT id, template_type, subject, body_html, is_active FROM email_templates WHERE store_id = $1 ORDER BY template_type',
      [user.store_id]
    );

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST /api/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { template_type, subject, body_html, is_active = true } = body;

    if (!template_type || !subject || !body_html) {
      return NextResponse.json(
        { error: 'template_type, subject, and body_html are required' },
        { status: 400 }
      );
    }

    const template = await queryOne<{
      id: number;
      template_type: string;
      subject: string;
      body_html: string;
      is_active: boolean;
    }>(
      `INSERT INTO email_templates (store_id, template_type, subject, body_html, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       ON CONFLICT (store_id, template_type) 
       DO UPDATE SET subject = $3, body_html = $4, is_active = $5, updated_at = now()
       RETURNING id, template_type, subject, body_html, is_active`,
      [user.store_id, template_type, subject, body_html, is_active]
    );

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create email template' },
      { status: 500 }
    );
  }
}

