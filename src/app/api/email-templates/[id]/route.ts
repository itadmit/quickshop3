import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/email-templates/[id] - Get single email template
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
    const templateId = parseInt(id, 10);

    const template = await queryOne<{
      id: number;
      template_type: string;
      subject: string;
      body_html: string;
      is_active: boolean;
    }>(
      'SELECT id, template_type, subject, body_html, is_active FROM email_templates WHERE id = $1 AND store_id = $2',
      [templateId, user.store_id]
    );

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

// PUT /api/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const templateId = parseInt(id, 10);
    const body = await request.json();
    const { subject, body_html, is_active } = body;

    if (!subject || !body_html) {
      return NextResponse.json(
        { error: 'subject and body_html are required' },
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
      `UPDATE email_templates 
       SET subject = $1, body_html = $2, is_active = $3, updated_at = now()
       WHERE id = $4 AND store_id = $5
       RETURNING id, template_type, subject, body_html, is_active`,
      [subject, body_html, is_active ?? true, templateId, user.store_id]
    );

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// DELETE /api/email-templates/[id] - Delete email template
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
    const templateId = parseInt(id, 10);

    await query(
      'DELETE FROM email_templates WHERE id = $1 AND store_id = $2',
      [templateId, user.store_id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete email template' },
      { status: 500 }
    );
  }
}

