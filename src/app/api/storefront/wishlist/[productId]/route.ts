import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { verifyStorefrontCustomerOptional } from '@/lib/storefront-auth';

// DELETE /api/storefront/wishlist/[productId] - Remove product from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId: productIdStr } = await params;
    const productId = parseInt(productIdStr);
    
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');
    
    if (!storeIdParam) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }
    
    const storeId = parseInt(storeIdParam);
    
    // Get store slug from request or use storeId
    const storeSlug = request.headers.get('x-store-slug') || storeIdParam;

    // Verify customer
    const authResult = await verifyStorefrontCustomerOptional(request, storeSlug);
    if (!authResult.success || !authResult.customer) {
      return NextResponse.json(
        { error: 'יש להתחבר כדי להסיר מרשימת המשאלות' },
        { status: 401 }
      );
    }
    
    const customer = authResult.customer;

    // Get wishlist
    const wishlist = await queryOne<{ id: number }>(
      'SELECT id FROM wishlists WHERE store_id = $1 AND customer_id = $2',
      [storeId, customer.id]
    );

    if (!wishlist) {
      return NextResponse.json({ success: true });
    }

    // Remove item
    await query(
      'DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2',
      [wishlist.id, productId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}

