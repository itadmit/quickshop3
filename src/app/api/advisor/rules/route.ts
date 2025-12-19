// API Routes for Advisor Product Rules
// GET /api/advisor/rules?quiz_id=X - Get rules for quiz
// POST /api/advisor/rules - Create/update rule

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AdvisorProductRule, CreateAdvisorProductRuleRequest } from '@/types/advisor';

/**
 * GET /api/advisor/rules - Get rules for a quiz with product details
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

    const rules = await query<any>(
      `SELECT 
        apr.*,
        p.title as product_title,
        p.handle as product_handle,
        p.status as product_status,
        pv.price as product_price,
        pv.compare_at_price as product_compare_at_price,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as product_image
       FROM advisor_product_rules apr
       JOIN products p ON p.id = apr.product_id
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       WHERE apr.quiz_id = $1
       ORDER BY apr.priority_boost DESC, apr.base_score DESC`,
      [parseInt(quizId)]
    );

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error('Error fetching advisor rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advisor/rules - Create or update rule (UPSERT)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const body: CreateAdvisorProductRuleRequest = await request.json();

    // Validate required fields
    if (!body.quiz_id) {
      return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
    }
    if (!body.product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }
    if (!body.answer_weights || !Array.isArray(body.answer_weights)) {
      return NextResponse.json({ error: 'answer_weights is required' }, { status: 400 });
    }

    // Verify quiz belongs to store
    const quiz = await queryOne<{ id: number }>(
      'SELECT id FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [body.quiz_id, storeId]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Verify product belongs to store
    const product = await queryOne<{ id: number }>(
      'SELECT id FROM products WHERE id = $1 AND store_id = $2',
      [body.product_id, storeId]
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if rule exists (UPSERT)
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM advisor_product_rules WHERE quiz_id = $1 AND product_id = $2',
      [body.quiz_id, body.product_id]
    );

    let rule;
    if (existing) {
      // Update existing rule
      rule = await queryOne<AdvisorProductRule>(
        `UPDATE advisor_product_rules SET
          answer_weights = $1,
          base_score = $2,
          bonus_rules = $3,
          exclude_if_answers = $4,
          priority_boost = $5,
          is_active = true,
          updated_at = now()
         WHERE id = $6
         RETURNING *`,
        [
          JSON.stringify(body.answer_weights),
          body.base_score ?? 0,
          body.bonus_rules ? JSON.stringify(body.bonus_rules) : null,
          body.exclude_if_answers || [],
          body.priority_boost ?? 0,
          existing.id,
        ]
      );
    } else {
      // Create new rule
      rule = await queryOne<AdvisorProductRule>(
        `INSERT INTO advisor_product_rules (
          quiz_id, product_id, answer_weights,
          base_score, bonus_rules, exclude_if_answers,
          priority_boost, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6,
          $7, true, now(), now()
        ) RETURNING *`,
        [
          body.quiz_id,
          body.product_id,
          JSON.stringify(body.answer_weights),
          body.base_score ?? 0,
          body.bonus_rules ? JSON.stringify(body.bonus_rules) : null,
          body.exclude_if_answers || [],
          body.priority_boost ?? 0,
        ]
      );
    }

    return NextResponse.json({ 
      rule,
      message: existing ? 'Rule updated successfully' : 'Rule created successfully',
    }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error('Error saving advisor rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advisor/rules - Delete rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');
    const productId = searchParams.get('product_id');

    if (!quizId || !productId) {
      return NextResponse.json({ error: 'quiz_id and product_id are required' }, { status: 400 });
    }

    // Verify quiz belongs to store
    const quiz = await queryOne<{ id: number }>(
      'SELECT id FROM advisor_quizzes WHERE id = $1 AND store_id = $2',
      [parseInt(quizId), storeId]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Delete rule
    await query(
      'DELETE FROM advisor_product_rules WHERE quiz_id = $1 AND product_id = $2',
      [parseInt(quizId), parseInt(productId)]
    );

    return NextResponse.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting advisor rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete rule' },
      { status: 500 }
    );
  }
}

