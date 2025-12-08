/**
 * Customizer Module - Blocks API Route
 * GET /api/customizer/sections/:sectionId/blocks
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { SectionBlock } from '@/lib/customizer/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sectionId } = await params;
    const sectionIdNum = parseInt(sectionId);

    if (isNaN(sectionIdNum)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    // בדוק שהסקשן שייך לחנות של המשתמש
    const sectionResult = await query<{ page_layout_id: number }>(
      `
      SELECT ps.page_layout_id
      FROM page_sections ps
      JOIN page_layouts pl ON pl.id = ps.page_layout_id
      WHERE ps.id = $1 AND pl.store_id = $2
      `,
      [sectionIdNum, user.store_id]
    );

    if (sectionResult.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // קרא את הבלוקים
    const blocksResult = await query<SectionBlock>(
      `
      SELECT * FROM section_blocks
      WHERE section_id = $1
      ORDER BY position ASC
      `,
      [sectionIdNum]
    );

    return NextResponse.json({
      blocks: blocksResult,
    });
  } catch (error) {
    console.error('Error getting blocks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

