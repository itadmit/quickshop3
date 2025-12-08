/**
 * Customizer Module - Template Widget API Route
 * PUT /api/customizer/templates/widgets/:widgetId
 * DELETE /api/customizer/templates/widgets/:widgetId
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { widgetId } = await params;
    const widgetIdNum = parseInt(widgetId);
    const body = await request.json();

    if (isNaN(widgetIdNum)) {
      return NextResponse.json(
        { error: 'Invalid widget ID' },
        { status: 400 }
      );
    }

    // בדוק שהה-widget שייך לחנות של המשתמש
    const widgetResult = await query<{ template_id: number }>(
      `
      SELECT tw.template_id
      FROM template_widgets tw
      JOIN page_templates pt ON pt.id = tw.template_id
      WHERE tw.id = $1 AND pt.store_id = $2
      `,
      [widgetIdNum, user.store_id]
    );

    if (widgetResult.length === 0) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // עדכן את ה-widget
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.settings !== undefined) {
      updates.push(`settings_json = $${paramIndex}`);
      values.push(JSON.stringify(body.settings));
      paramIndex++;
    }

    if (body.position !== undefined) {
      updates.push(`position = $${paramIndex}`);
      values.push(body.position);
      paramIndex++;
    }

    if (body.is_visible !== undefined) {
      updates.push(`is_visible = $${paramIndex}`);
      values.push(body.is_visible);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = now()`);
    values.push(widgetIdNum);

    await query(
      `
      UPDATE template_widgets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      `,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating widget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { widgetId } = await params;
    const widgetIdNum = parseInt(widgetId);

    if (isNaN(widgetIdNum)) {
      return NextResponse.json(
        { error: 'Invalid widget ID' },
        { status: 400 }
      );
    }

    // בדוק שהה-widget שייך לחנות של המשתמש
    const widgetResult = await query(
      `
      SELECT tw.id
      FROM template_widgets tw
      JOIN page_templates pt ON pt.id = tw.template_id
      WHERE tw.id = $1 AND pt.store_id = $2
      `,
      [widgetIdNum, user.store_id]
    );

    if (widgetResult.length === 0) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    await query(`DELETE FROM template_widgets WHERE id = $1`, [widgetIdNum]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

