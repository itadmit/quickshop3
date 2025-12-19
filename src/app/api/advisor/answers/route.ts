// API Routes for Advisor Answers
// GET /api/advisor/answers?question_id=X - Get answers for question
// POST /api/advisor/answers - Create new answer

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorAnswer, CreateAdvisorAnswerRequest } from '@/types/advisor';

/**
 * GET /api/advisor/answers - Get answers for a question
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('question_id');

    if (!questionId) {
      return NextResponse.json({ error: 'question_id is required' }, { status: 400 });
    }

    // Verify question belongs to store's quiz
    const question = await queryOne<{ id: number }>(
      `SELECT q.id FROM advisor_questions q
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE q.id = $1 AND quiz.store_id = $2`,
      [parseInt(questionId), storeId]
    );

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const answers = await query<AdvisorAnswer>(
      'SELECT * FROM advisor_answers WHERE question_id = $1 ORDER BY position ASC',
      [parseInt(questionId)]
    );

    return NextResponse.json({ answers });
  } catch (error: any) {
    console.error('Error fetching advisor answers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch answers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advisor/answers - Create new answer
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body: CreateAdvisorAnswerRequest = await request.json();

    // Validate required fields
    if (!body.question_id) {
      return NextResponse.json({ error: 'question_id is required' }, { status: 400 });
    }
    if (!body.answer_text?.trim()) {
      return NextResponse.json({ error: 'answer_text is required' }, { status: 400 });
    }

    // Verify question belongs to store's quiz
    const question = await queryOne<{ id: number }>(
      `SELECT q.id FROM advisor_questions q
       JOIN advisor_quizzes quiz ON quiz.id = q.quiz_id
       WHERE q.id = $1 AND quiz.store_id = $2`,
      [body.question_id, storeId]
    );

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Get next position
    const lastPosition = await queryOne<{ max_pos: number }>(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM advisor_answers WHERE question_id = $1',
      [body.question_id]
    );
    const position = body.position ?? (lastPosition?.max_pos || 0) + 1;

    // Create answer
    const answer = await queryOne<AdvisorAnswer>(
      `INSERT INTO advisor_answers (
        question_id, answer_text, answer_subtitle,
        image_url, icon, emoji, color, value,
        position, created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, now(), now()
      ) RETURNING *`,
      [
        body.question_id,
        body.answer_text.trim(),
        body.answer_subtitle || null,
        body.image_url || null,
        body.icon || null,
        body.emoji || null,
        body.color || null,
        body.value || body.answer_text.toLowerCase().replace(/\s+/g, '_'),
        position,
      ]
    );

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating advisor answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create answer' },
      { status: 500 }
    );
  }
}

