import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// DELETE /api/files/delete - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'path is required' },
        { status: 400 }
      );
    }

    const pool = getDb();

    // Delete from database
    await pool.query('DELETE FROM files WHERE path = $1', [filePath]);

    // Try to delete physical file (best effort - don't fail if file doesn't exist)
    try {
      // If it's an S3 URL, skip physical deletion
      if (!filePath.startsWith('http')) {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        await fs.unlink(fullPath);
      }
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError);
      // Don't fail the request if physical deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

