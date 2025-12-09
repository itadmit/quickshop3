import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/files - Get all files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const type = searchParams.get('type'); // 'image' or 'video'

    if (!shopId) {
      return NextResponse.json(
        { error: 'shopId is required' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;
    const pool = getDb();

    // Build query
    let query = `
      SELECT id, name, path, size, mime_type as "mimeType", 
             entity_type as "entityType", entity_id as "entityId", 
             created_at as "createdAt"
      FROM files
      WHERE shop_id = $1
    `;
    
    const params: any[] = [shopId];
    
    if (search) {
      query += ` AND name ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    // Filter by file type
    if (type === 'image') {
      query += ` AND (mime_type LIKE 'image/%' OR path ~* '\\.(jpg|jpeg|png|gif|webp|svg)$')`;
    } else if (type === 'video') {
      query += ` AND (mime_type LIKE 'video/%' OR path ~* '\\.(mp4|webm|ogg|mov|avi)$')`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM files WHERE shop_id = $1';
    const countParams: any[] = [shopId];
    
    if (search) {
      countQuery += ` AND name ILIKE $${countParams.length + 1}`;
      countParams.push(`%${search}%`);
    }

    if (type === 'image') {
      countQuery += ` AND (mime_type LIKE 'image/%' OR path ~* '\\.(jpg|jpeg|png|gif|webp|svg)$')`;
    } else if (type === 'video') {
      countQuery += ` AND (mime_type LIKE 'video/%' OR path ~* '\\.(mp4|webm|ogg|mov|avi)$')`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      files: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

