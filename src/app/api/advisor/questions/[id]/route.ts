// API Routes for Single Advisor Question
// GET /api/advisor/questions/:id - Get question with answers
// PUT /api/advisor/questions/:id - Update question
// DELETE /api/advisor/questions/:id - Delete question

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorQuestion, UpdateAdvisorQuestionRequest } from '@/types/advisor';

/**
 * GET /api/advisor/questions/:id - Get question with answers
 */
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
    const questionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Get question with quiz verification
    const question = await queryOne<AdvisorQuestion & { store_id: number }>(
      `SELECT q.*, quiz.store_id
       FROM advisor_questions q
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE q.id = $1 AND quiz.store_id = $2`,
      [questionId, storeId]
    );

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get answers
    const answers = await query<any>(
      'SELECT * FROM advisor_answers WHERE question_id = $1 ORDER BY position ASC',
      [questionId]
    );

    return NextResponse.json({
      question: {
        ...question,
        answers,
      },
    });
  } catch (error: any) {
    console.error('Error fetching advisor question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/advisor/questions/:id - Update question
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
    const questionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const body: UpdateAdvisorQuestionRequest = await request.json();

    // Verify question belongs to store's quiz
    const existing = await queryOne<{ id: number }>(
      `SELECT q.id FROM advisor_questions q
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE q.id = $1 AND quiz.store_id = $2`,
      [questionId, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: (keyof UpdateAdvisorQuestionRequest)[] = [
      'question_text', 'question_subtitle', 'image_url',
      'question_type', 'answers_layout', 'columns',
      'is_required', 'min_selections', 'max_selections', 'position',
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
    values.push(questionId);

    const question = await queryOne<AdvisorQuestion>(
      `UPDATE advisor_questions SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error('Error updating advisor question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advisor/questions/:id - Delete question
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
    const questionId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    // Verify question belongs to store's quiz
    const existing = await queryOne<{ id: number }>(
      `SELECT q.id FROM advisor_questions q
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE q.id = $1 AND quiz.store_id = $2`,
      [questionId, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Delete question (cascades to answers)
    await query('DELETE FROM advisor_questions WHERE id = $1', [questionId]);

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting advisor question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}

