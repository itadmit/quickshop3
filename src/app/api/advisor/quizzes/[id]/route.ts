// API Routes for Single Advisor Quiz
// GET /api/advisor/quizzes/:id - Get quiz by ID
// PUT /api/advisor/quizzes/:id - Update quiz
// DELETE /api/advisor/quizzes/:id - Delete quiz

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorQuiz, UpdateAdvisorQuizRequest } from '@/types/advisor';

/**
 * GET /api/advisor/quizzes/:id - Get quiz with questions and answers
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
    const quizId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    // Get quiz
    const quiz = await queryOne<AdvisorQuiz>(
      'SELECT * FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [quizId, storeId]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get questions with answers
    const questions = await query<any>(
      'SELECT * FROM advisor_questions WHERE quiz_id = $1 ORDER BY position ASC',
      [quizId]
    );

    for (const question of questions) {
      const answers = await query<any>(
        'SELECT * FROM advisor_answers WHERE question_id = $1 ORDER BY position ASC',
        [question.id]
      );
      question.answers = answers;
    }

    // Get product rules
    const rules = await query<any>(
      `SELECT apr.*, p.title as product_title, p.handle as product_handle,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as product_image
       FROM advisor_product_rules apr
       JOIN products p ON p.id = apr.product_id
       WHERE apr.quiz_id = $1 AND apr.is_active = true
       ORDER BY apr.priority_boost DESC`,
      [quizId]
    );

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions,
        rules,
      },
    });
  } catch (error: any) {
    console.error('Error fetching advisor quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/advisor/quizzes/:id - Update quiz
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
    const quizId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const body: UpdateAdvisorQuizRequest = await request.json();

    // Verify quiz belongs to store
    const existing = await queryOne<AdvisorQuiz>(
      'SELECT * FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [quizId, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: (keyof UpdateAdvisorQuizRequest)[] = [
      'title', 'slug', 'description', 'subtitle', 'image_url', 'icon',
      'is_active', 'show_progress_bar', 'show_question_numbers',
      'allow_back_navigation', 'results_count', 'primary_color',
      'background_color', 'button_style', 'start_button_text',
      'results_title', 'results_subtitle', 'show_floating_button',
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
    values.push(quizId, storeId);

    const quiz = await queryOne<AdvisorQuiz>(
      `UPDATE advisor_quizzes SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return NextResponse.json({ quiz });
  } catch (error: any) {
    console.error('Error updating advisor quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advisor/quizzes/:id - Delete quiz
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
    const quizId = parseInt(id);
    const storeId = user.store_id;

    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    // Verify quiz belongs to store
    const existing = await queryOne<AdvisorQuiz>(
      'SELECT id FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [quizId, storeId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Delete quiz (cascades to questions, answers, rules, sessions)
    await query('DELETE FROM advisor_quizzes WHERE id = $1', [quizId]);

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting advisor quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}

