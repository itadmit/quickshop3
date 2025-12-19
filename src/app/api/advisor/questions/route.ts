// API Routes for Advisor Questions
// GET /api/advisor/questions?quiz_id=X - Get questions for quiz
// POST /api/advisor/questions - Create new question

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorQuestion, CreateAdvisorQuestionRequest } from '@/types/advisor';

/**
 * GET /api/advisor/questions - Get questions for a quiz
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');
    const includeAnswers = searchParams.get('include_answers') === 'true';

    if (!quizId) {
      return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
    }

    // Verify quiz belongs to store
    const quiz = await queryOne<{ id: number }>(
      'SELECT id FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [parseInt(quizId), storeId]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const questions = await query<AdvisorQuestion>(
      'SELECT * FROM advisor_questions WHERE quiz_id = $1 ORDER BY position ASC',
      [parseInt(quizId)]
    );

    if (includeAnswers) {
      for (const question of questions) {
        const answers = await query<any>(
          'SELECT * FROM advisor_answers WHERE question_id = $1 ORDER BY position ASC',
          [question.id]
        );
        (question as any).answers = answers;
      }
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('Error fetching advisor questions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advisor/questions - Create new question
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body: CreateAdvisorQuestionRequest = await request.json();

    // Validate required fields
    if (!body.quiz_id) {
      return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
    }
    if (!body.question_text?.trim()) {
      return NextResponse.json({ error: 'question_text is required' }, { status: 400 });
    }

    // Verify quiz belongs to store
    const quiz = await queryOne<{ id: number }>(
      'SELECT id FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [body.quiz_id, storeId]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get next position
    const lastPosition = await queryOne<{ max_pos: number }>(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM advisor_questions WHERE quiz_id = $1',
      [body.quiz_id]
    );
    const position = body.position ?? (lastPosition?.max_pos || 0) + 1;

    // Create question
    const question = await queryOne<AdvisorQuestion>(
      `INSERT INTO advisor_questions (
        quiz_id, question_text, question_subtitle, image_url,
        question_type, answers_layout, columns,
        is_required, min_selections, max_selections,
        position, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, now(), now()
      ) RETURNING *`,
      [
        body.quiz_id,
        body.question_text.trim(),
        body.question_subtitle || null,
        body.image_url || null,
        body.question_type || 'single',
        body.answers_layout || 'grid',
        body.columns ?? 2,
        body.is_required ?? true,
        body.min_selections ?? 1,
        body.max_selections || null,
        position,
      ]
    );

    return NextResponse.json({ question }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating advisor question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create question' },
      { status: 500 }
    );
  }
}

