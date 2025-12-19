// Storefront API for Advisor Quiz
// GET /api/storefront/advisor/:slug - Get quiz for public display

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { AdvisorQuizWithQuestions } from '@/types/advisor';

/**
 * GET /api/storefront/advisor/:slug - Get quiz by slug for storefront
 * This endpoint is PUBLIC
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('store');

    if (!storeSlug) {
      return NextResponse.json({ error: 'store parameter is required' }, { status: 400 });
    }

    // Get store ID from slug
    const store = await queryOne<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get quiz by slug
    const quiz = await queryOne<any>(
      `SELECT 
        id, store_id, title, slug, description, subtitle,
        image_url, icon, is_active,
        show_progress_bar, show_question_numbers, allow_back_navigation,
        results_count, primary_color, background_color, button_style,
        start_button_text, results_title, results_subtitle
       FROM advisor_quizzes 
       WHERE store_id = $1 AND slug = $2 AND is_active = true`,
      [store.id, slug]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get questions with answers
    const questions = await query<any>(
      `SELECT 
        id, quiz_id, question_text, question_subtitle, image_url,
        question_type, answers_layout, columns,
        is_required, min_selections, max_selections, position
       FROM advisor_questions 
       WHERE quiz_id = $1 
       ORDER BY position ASC`,
      [quiz.id]
    );

    for (const question of questions) {
      const answers = await query<any>(
        `SELECT 
          id, question_id, answer_text, answer_subtitle,
          image_url, icon, emoji, color, value, position
         FROM advisor_answers 
         WHERE question_id = $1 
         ORDER BY position ASC`,
        [question.id]
      );
      question.answers = answers;
    }

    // Update start count
    await query(
      `UPDATE advisor_quizzes SET 
        total_starts = total_starts + 1,
        updated_at = now()
       WHERE id = $1`,
      [quiz.id]
    );

    const result: AdvisorQuizWithQuestions = {
      ...quiz,
      questions,
    };

    return NextResponse.json({ quiz: result });
  } catch (error: any) {
    console.error('Error fetching storefront advisor quiz:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

