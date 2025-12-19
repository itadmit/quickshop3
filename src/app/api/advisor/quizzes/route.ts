// API Routes for Smart Advisor Quizzes
// GET /api/advisor/quizzes - Get all quizzes
// POST /api/advisor/quizzes - Create new quiz

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorQuiz, CreateAdvisorQuizRequest } from '@/types/advisor';

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * GET /api/advisor/quizzes - Get all quizzes for store
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get('include_questions') === 'true';
    const activeOnly = searchParams.get('active_only') === 'true';

    let whereClause = 'WHERE store_id = $1';
    if (activeOnly) {
      whereClause += ' AND is_active = true';
    }

    const quizzes = await query<AdvisorQuiz>(
      `SELECT * FROM advisor_quizzes ${whereClause} ORDER BY position ASC, created_at DESC`,
      [storeId]
    );

    // Optionally include questions with answers
    if (includeQuestions) {
      for (const quiz of quizzes) {
        const questions = await query<any>(
          `SELECT * FROM advisor_questions WHERE quiz_id = $1 ORDER BY position ASC`,
          [quiz.id]
        );

        for (const question of questions) {
          const answers = await query<any>(
            `SELECT * FROM advisor_answers WHERE question_id = $1 ORDER BY position ASC`,
            [question.id]
          );
          question.answers = answers;
        }

        (quiz as any).questions = questions;
      }
    }

    return NextResponse.json({ quizzes });
  } catch (error: any) {
    console.error('Error fetching advisor quizzes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advisor/quizzes - Create new quiz
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body: CreateAdvisorQuizRequest = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug if not provided
    let slug = body.slug?.trim() || generateSlug(body.title);

    // Check if slug exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM advisor_quizzes WHERE store_id = $1 AND slug = $2',
      [storeId, slug]
    );

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get next position
    const lastPosition = await queryOne<{ max_pos: number }>(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM advisor_quizzes WHERE store_id = $1',
      [storeId]
    );
    const position = (lastPosition?.max_pos || 0) + 1;

    // Create quiz
    const quiz = await queryOne<AdvisorQuiz>(
      `INSERT INTO advisor_quizzes (
        store_id, title, slug, description, subtitle,
        image_url, icon, is_active,
        show_progress_bar, show_question_numbers, allow_back_navigation,
        results_count, primary_color, background_color, button_style,
        start_button_text, results_title, results_subtitle,
        position, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18,
        $19, now(), now()
      ) RETURNING *`,
      [
        storeId,
        body.title.trim(),
        slug,
        body.description || null,
        body.subtitle || null,
        body.image_url || null,
        body.icon || null,
        body.is_active ?? false,
        body.show_progress_bar ?? true,
        body.show_question_numbers ?? true,
        body.allow_back_navigation ?? true,
        body.results_count ?? 3,
        body.primary_color || '#000000',
        body.background_color || '#FFFFFF',
        body.button_style || 'rounded',
        body.start_button_text || 'בואו נתחיל!',
        body.results_title || 'המוצרים המומלצים עבורך',
        body.results_subtitle || 'על פי התשובות שלך, הנה המוצרים הכי מתאימים:',
        position,
      ]
    );

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating advisor quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

