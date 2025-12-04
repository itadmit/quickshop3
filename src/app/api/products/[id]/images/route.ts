import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { ProductImage } from '@/types/product';

// POST /api/products/[id]/images - Upload product images
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const { urls } = body; // Array of image URLs

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'urls array is required' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await queryOne<{ store_id: number }>(
      'SELECT store_id FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get max position for this product
    const maxPosition = await queryOne<{ max: number }>(
      'SELECT COALESCE(MAX(position), 0) as max FROM product_images WHERE product_id = $1',
      [productId]
    );

    const insertedImages: ProductImage[] = [];

    // Insert images
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const position = (maxPosition?.max || 0) + i + 1;

      const sql = `
        INSERT INTO product_images (
          product_id, position, src, alt, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, now(), now())
        RETURNING *
      `;

      const image = await queryOne<ProductImage>(sql, [
        productId,
        position,
        url,
        null, // alt text can be set later
      ]);

      if (image) {
        insertedImages.push(image);
      }
    }

    return NextResponse.json({
      success: true,
      images: insertedImages,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload images' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/images - Delete product image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    
    // Get image ID from query string or body
    const url = new URL(request.url);
    const imageIdParam = url.searchParams.get('image_id') || (await request.json()).image_id;
    const imageId = imageIdParam ? parseInt(imageIdParam) : NaN;

    // Verify image belongs to product
    const image = await queryOne<ProductImage>(
      'SELECT * FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete image
    await query('DELETE FROM product_images WHERE id = $1', [imageId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}

