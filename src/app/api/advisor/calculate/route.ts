// API Route for Calculating Advisor Results
// POST /api/advisor/calculate - Calculate recommended products based on answers

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { 
  CalculateResultsRequest, 
  CalculateResultsResponse,
  AdvisorResult,
  AnswerWeight,
  BonusRule,
} from '@/types/advisor';
import { randomUUID } from 'crypto';

interface ProductScore {
  product_id: number;
  title: string;
  handle: string;
  image_url: string | null;
  price: string;
  compare_at_price: string | null;
  score: number;
  max_possible_score: number;
  matched_weights: AnswerWeight[];
}

/**
 * POST /api/advisor/calculate - Calculate recommended products
 * This endpoint is PUBLIC (for storefront)
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculateResultsRequest = await request.json();

    // Validate required fields
    if (!body.quiz_id) {
      return NextResponse.json({ error: 'quiz_id is required' }, { status: 400 });
    }
    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json({ error: 'answers are required' }, { status: 400 });
    }

    // Get quiz
    const quiz = await queryOne<{ 
      id: number; 
      store_id: number; 
      results_count: number;
      is_active: boolean;
    }>(
      'SELECT id, store_id, results_count, is_active FROM advisor_quizzes WHERE id = $1',
      [body.quiz_id]
    );

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (!quiz.is_active) {
      return NextResponse.json({ error: 'Quiz is not active' }, { status: 400 });
    }

    // Collect all selected answer IDs
    const selectedAnswerIds: number[] = [];
    for (const answer of body.answers) {
      selectedAnswerIds.push(...answer.answer_ids);
    }

    // Get all product rules for this quiz
    const rules = await query<{
      id: number;
      product_id: number;
      answer_weights: AnswerWeight[];
      base_score: number;
      bonus_rules: BonusRule | null;
      exclude_if_answers: number[];
      priority_boost: number;
    }>(
      `SELECT * FROM advisor_product_rules 
       WHERE quiz_id = $1 AND is_active = true`,
      [body.quiz_id]
    );

    // Calculate scores for each product
    const productScores: Map<number, ProductScore> = new Map();

    for (const rule of rules) {
      // Check exclusion rules first
      const shouldExclude = rule.exclude_if_answers?.some(
        (answerId: number) => selectedAnswerIds.includes(answerId)
      );
      
      if (shouldExclude) {
        continue; // Skip this product
      }

      // Calculate base score
      let score = rule.base_score || 0;
      let maxPossibleScore = rule.base_score || 0;
      const matchedWeights: AnswerWeight[] = [];

      // Add weights for selected answers
      const weights = Array.isArray(rule.answer_weights) 
        ? rule.answer_weights 
        : JSON.parse(rule.answer_weights as any);

      for (const weight of weights) {
        maxPossibleScore += weight.weight;
        
        if (selectedAnswerIds.includes(weight.answer_id)) {
          score += weight.weight;
          matchedWeights.push(weight);
        }
      }

      // Check bonus rules
      if (rule.bonus_rules) {
        const bonusRules = typeof rule.bonus_rules === 'string' 
          ? JSON.parse(rule.bonus_rules) 
          : rule.bonus_rules;
        
        if (bonusRules.all_answers && Array.isArray(bonusRules.all_answers)) {
          const allBonusAnswersSelected = bonusRules.all_answers.every(
            (answerId: number) => selectedAnswerIds.includes(answerId)
          );
          
          if (allBonusAnswersSelected) {
            score += bonusRules.bonus || 0;
          }
        }
      }

      // Add priority boost
      score += rule.priority_boost || 0;

      // Only include products with positive score
      if (score > 0) {
        productScores.set(rule.product_id, {
          product_id: rule.product_id,
          title: '',
          handle: '',
          image_url: null,
          price: '0',
          compare_at_price: null,
          score,
          max_possible_score: maxPossibleScore,
          matched_weights: matchedWeights,
        });
      }
    }

    // Get product details for matched products
    const productIds = Array.from(productScores.keys());
    
    if (productIds.length === 0) {
      // No matching products - return empty results
      const sessionId = body.session_id || randomUUID();
      
      // Save session
      await saveSession(body.quiz_id, sessionId, body.answers, [], null);
      
      return NextResponse.json({
        results: [],
        session_id: sessionId,
        total_products_matched: 0,
      } as CalculateResultsResponse);
    }

    const products = await query<{
      id: number;
      title: string;
      handle: string;
      price: string;
      compare_at_price: string | null;
      image_url: string | null;
    }>(
      `SELECT 
        p.id,
        p.title,
        p.handle,
        pv.price,
        pv.compare_at_price,
        (SELECT src FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) as image_url
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.position = 1
       WHERE p.id = ANY($1) AND p.status = 'active'`,
      [productIds]
    );

    // Merge product details with scores
    const results: AdvisorResult[] = [];
    
    for (const product of products) {
      const scoreData = productScores.get(product.id);
      if (scoreData) {
        const matchPercentage = scoreData.max_possible_score > 0
          ? Math.round((scoreData.score / scoreData.max_possible_score) * 100)
          : 0;
        
        results.push({
          product_id: product.id,
          title: product.title,
          handle: product.handle,
          image_url: product.image_url,
          price: product.price,
          compare_at_price: product.compare_at_price,
          score: scoreData.score,
          match_percentage: Math.min(matchPercentage, 100), // Cap at 100%
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Limit to quiz results_count
    const limitedResults = results.slice(0, quiz.results_count);

    // Generate session ID
    const sessionId = body.session_id || randomUUID();

    // Save session for analytics
    await saveSession(
      body.quiz_id, 
      sessionId, 
      body.answers, 
      limitedResults,
      request.headers.get('user-agent')
    );

    // Update quiz stats
    await query(
      `UPDATE advisor_quizzes SET 
        total_completions = total_completions + 1,
        updated_at = now()
       WHERE id = $1`,
      [body.quiz_id]
    );

    return NextResponse.json({
      results: limitedResults,
      session_id: sessionId,
      total_products_matched: results.length,
    } as CalculateResultsResponse);

  } catch (error: any) {
    console.error('Error calculating advisor results:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate results' },
      { status: 500 }
    );
  }
}

/**
 * Save session for analytics
 */
async function saveSession(
  quizId: number,
  sessionId: string,
  answers: any[],
  results: AdvisorResult[],
  userAgent: string | null
) {
  try {
    await query(
      `INSERT INTO advisor_sessions (
        quiz_id, session_id, answers, recommended_products,
        is_completed, completed_at, user_agent, created_at
      ) VALUES (
        $1, $2, $3, $4,
        true, now(), $5, now()
      )`,
      [
        quizId,
        sessionId,
        JSON.stringify(answers),
        JSON.stringify(results.map(r => ({ 
          product_id: r.product_id, 
          score: r.score,
          match_percentage: r.match_percentage,
        }))),
        userAgent,
      ]
    );
  } catch (error) {
    console.error('Error saving advisor session:', error);
    // Don't throw - session saving is not critical
  }
}

