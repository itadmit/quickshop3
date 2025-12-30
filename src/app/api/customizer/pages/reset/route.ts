/**
 * Customizer Module - Reset Page Layout API Route
 * DELETE /api/customizer/pages/reset?pageType=product
 * Deletes the saved page layout so the default template is used
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType');
    const pageHandle = searchParams.get('pageHandle');

    if (!pageType) {
      return NextResponse.json(
        { error: 'pageType is required' },
        { status: 400 }
      );
    }

    console.log('[Customizer Reset] Store ID:', user.store_id, 'Page Type:', pageType, 'Handle:', pageHandle);

    // Find the page layout
    let findQuery = `
      SELECT id FROM page_layouts
      WHERE store_id = $1 AND page_type = $2
    `;
    const params: any[] = [user.store_id, pageType];
    
    if (pageHandle) {
      findQuery += ' AND page_handle = $3';
      params.push(pageHandle);
    } else {
      findQuery += ' AND page_handle IS NULL';
    }

    const layoutResult = await query(findQuery, params);

    if (layoutResult.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No layout found to reset - already using default template'
      });
    }

    const layoutId = layoutResult[0].id;

    // Delete section blocks first (foreign key constraint)
    await query(`
      DELETE FROM section_blocks 
      WHERE section_id IN (SELECT id FROM page_sections WHERE page_layout_id = $1)
    `, [layoutId]);

    // Delete sections
    await query(`
      DELETE FROM page_sections WHERE page_layout_id = $1
    `, [layoutId]);

    // Delete the page layout itself
    await query(`
      DELETE FROM page_layouts WHERE id = $1
    `, [layoutId]);

    console.log('[Customizer Reset] Successfully deleted layout:', layoutId);

    return NextResponse.json({
      success: true,
      message: 'Page layout reset to default template',
      deletedLayoutId: layoutId
    });

  } catch (error) {
    console.error('Error resetting page layout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





