// API Routes for Advisor Analytics
// GET /api/advisor/analytics?quiz_id=X - Get analytics for quiz

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorAnalytics, AdvisorDropoffAnalytics } from '@/types/advisor';

/**
 * GET /api/advisor/analytics - Get analytics for a quiz
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
    const periodDays = parseInt(searchParams.get('days') || '30');

    if (!quizId) {
      return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
    }

    // Verify quiz belongs to store
    const quiz = await queryOne<{ 
      id: number; 
      title: string;
      total_starts: number;
      total_completions: number;
    }>(
      'SELECT id, title, total_starts, total_completions FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [parseInt(quizId), storeId]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Get session stats
    const sessionStats = await queryOne<{
      total_sessions: number;
      completed_sessions: number;
      converted_to_cart: number;
      converted_to_order: number;
    }>(
      `SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_completed = true) as completed_sessions,
        COUNT(*) FILTER (WHERE converted_to_cart = true) as converted_to_cart,
        COUNT(*) FILTER (WHERE converted_to_order = true) as converted_to_order
       FROM advisor_sessions 
       WHERE quiz_id = $1 AND created_at >= $2`,
      [parseInt(quizId), periodStart]
    );

    // Get revenue from converted orders
    const revenueStats = await queryOne<{
      total_revenue: number;
      order_count: number;
    }>(
      `SELECT 
        COALESCE(SUM(o.total_price::numeric), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
       FROM advisor_sessions s
       JOIN orders o ON o.id = s.order_id
       WHERE s.quiz_id = $1 AND s.created_at >= $2 AND s.converted_to_order = true`,
      [parseInt(quizId), periodStart]
    );

    // Get popular answers
    const popularAnswers = await query<{
      question_id: number;
      question_text: string;
      answer_id: number;
      answer_text: string;
      count: number;
    }>(
      `WITH answer_counts AS (
        SELECT 
          q.id as question_id,
          q.question_text,
          a.id as answer_id,
          a.answer_text,
          COUNT(*) as count
        FROM advisor_sessions s,
          jsonb_array_elements(s.answers) as session_answer,
          jsonb_array_elements_text(session_answer->'answer_ids') as selected_answer_id
        JOIN advisor_questions q ON q.id = (session_answer->>'question_id')::int
        JOIN advisor_answers a ON a.id = selected_answer_id::int
        WHERE s.quiz_id = $1 AND s.created_at >= $2 AND s.is_completed = true
        GROUP BY q.id, q.question_text, a.id, a.answer_text
      )
      SELECT * FROM answer_counts
      ORDER BY question_id, count DESC`,
      [parseInt(quizId), periodStart]
    );

    // Group answers by question
    const questionMap = new Map<number, any>();
    for (const row of popularAnswers) {
      if (!questionMap.has(row.question_id)) {
        questionMap.set(row.question_id, {
          question_id: row.question_id,
          question_text: row.question_text,
          answers: [],
        });
      }
      questionMap.get(row.question_id).answers.push({
        answer_id: row.answer_id,
        answer_text: row.answer_text,
        count: parseInt(String(row.count)),
        percentage: 0, // Will calculate below
      });
    }

    // Calculate percentages
    for (const question of questionMap.values()) {
      const totalAnswers = question.answers.reduce((sum: number, a: any) => sum + a.count, 0);
      for (const answer of question.answers) {
        answer.percentage = totalAnswers > 0 
          ? Math.round((answer.count / totalAnswers) * 100) 
          : 0;
      }
    }

    // Get top recommended products
    const topProducts = await query<{
      product_id: number;
      product_title: string;
      times_recommended: number;
      times_purchased: number;
    }>(
      `WITH recommended AS (
        SELECT 
          (rec->>'product_id')::int as product_id,
          COUNT(*) as times_recommended
        FROM advisor_sessions s,
          jsonb_array_elements(s.recommended_products) as rec
        WHERE s.quiz_id = $1 AND s.created_at >= $2 AND s.is_completed = true
        GROUP BY (rec->>'product_id')::int
      ),
      purchased AS (
        SELECT 
          oli.product_id,
          COUNT(DISTINCT s.id) as times_purchased
        FROM advisor_sessions s
        JOIN orders o ON o.id = s.order_id
        JOIN order_line_items oli ON oli.order_id = o.id
        WHERE s.quiz_id = $1 AND s.created_at >= $2 AND s.converted_to_order = true
        GROUP BY oli.product_id
      )
      SELECT 
        r.product_id,
        p.title as product_title,
        r.times_recommended::int,
        COALESCE(pur.times_purchased, 0)::int as times_purchased
      FROM recommended r
      JOIN products p ON p.id = r.product_id
      LEFT JOIN purchased pur ON pur.product_id = r.product_id
      ORDER BY r.times_recommended DESC
      LIMIT 10`,
      [parseInt(quizId), periodStart]
    );

    const completionRate = quiz.total_starts > 0 
      ? Math.round((quiz.total_completions / quiz.total_starts) * 100) 
      : 0;

    const completedSessions = sessionStats?.completed_sessions || 0;
    const convertedToOrder = sessionStats?.converted_to_order || 0;
    const conversionRate = completedSessions > 0
      ? Math.round((convertedToOrder / completedSessions) * 100)
      : 0;

    const orderCount = revenueStats?.order_count || 0;
    const totalRevenue = revenueStats?.total_revenue || 0;
    const avgOrderValue = orderCount > 0
      ? Math.round(totalRevenue / orderCount)
      : 0;

    const analytics: AdvisorAnalytics = {
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      
      total_starts: quiz.total_starts,
      total_completions: quiz.total_completions,
      completion_rate: completionRate,
      
      added_to_cart: sessionStats?.converted_to_cart || 0,
      converted_to_order: sessionStats?.converted_to_order || 0,
      conversion_rate: conversionRate,
      
      total_revenue: revenueStats?.total_revenue || 0,
      average_order_value: avgOrderValue,
      
      popular_answers: Array.from(questionMap.values()),
      top_products: topProducts.map(p => ({
        product_id: p.product_id,
        product_title: p.product_title,
        times_recommended: p.times_recommended,
        times_purchased: p.times_purchased,
      })),
      
      period_start: periodStart,
      period_end: new Date(),
    };

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error fetching advisor analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

