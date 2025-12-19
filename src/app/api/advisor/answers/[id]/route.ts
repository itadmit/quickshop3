// API Routes for Single Advisor Answer
// PUT /api/advisor/answers/:id - Update answer
// DELETE /api/advisor/answers/:id - Delete answer

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorAnswer, UpdateAdvisorAnswerRequest } from '@/types/advisor';

/**
 * PUT /api/advisor/answers/:id - Update answer
 */
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
    const answerId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(answerId)) {
      return NextResponse.json({ error: 'Invalid answer ID' }, { status: 400 });
    }

    const body: UpdateAdvisorAnswerRequest = await request.json();

    // Verify answer belongs to store's quiz
    const existing = await queryOne<{ id: number }>(
      `SELECT a.id FROM advisor_answers a
       JOIN advisor_questions q ON q.id = a.question_id
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE a.id = $1 AND quiz.store_id = $2`,
      [answerId, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: (keyof UpdateAdvisorAnswerRequest)[] = [
      'answer_text', 'answer_subtitle', 'image_url',
      'icon', 'emoji', 'color', 'value', 'position',
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${String(field)} = $${paramIndex}`);
        values.push(body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(answerId);

    const answer = await queryOne<AdvisorAnswer>(
      `UPDATE advisor_answers SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Error updating advisor answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update answer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advisor/answers/:id - Delete answer
 */
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
    const answerId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(answerId)) {
      return NextResponse.json({ error: 'Invalid answer ID' }, { status: 400 });
    }

    // Verify answer belongs to store's quiz
    const existing = await queryOne<{ id: number }>(
      `SELECT a.id FROM advisor_answers a
       JOIN advisor_questions q ON q.id = a.question_id
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE a.id = $1 AND quiz.store_id = $2`,
      [answerId, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    // Delete answer
    await query('DELETE FROM advisor_answers WHERE id = $1', [answerId]);

    return NextResponse.json({ success: true, message: 'Answer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting advisor answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete answer' },
      { status: 500 }
    );
  }
}

