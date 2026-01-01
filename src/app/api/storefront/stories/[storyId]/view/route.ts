// API Route for marking a story as viewed
import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

interface RouteParams {
  params: Promise<{ storyId: string }>;
}

/**
 * POST /api/storefront/stories/[storyId]/view - Mark story as viewed
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Verify story exists
    const story = await queryOne(
      `SELECT id FROM product_stories WHERE id = $1`,
      [storyId]
    );

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Get session ID
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('story_session')?.value;
    if (!sessionId) {
      sessionId = randomUUID();
    }

    // Get customer ID if logged in
    const customerId = cookieStore.get('customer_id')?.value;

    // Insert view (ignore if already viewed)
    await query(
      `INSERT INTO story_views (story_id, customer_id, session_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [storyId, customerId || null, sessionId]
    );

    const response = NextResponse.json({ success: true });

    // Set session cookie if new
    if (!cookieStore.get('story_session')) {
      response.cookies.set('story_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error marking story as viewed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark story as viewed' },
      { status: 500 }
    );
  }
}

