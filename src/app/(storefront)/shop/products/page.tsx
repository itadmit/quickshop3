import { query } from '@/lib/db';
import { ProductCard } from '@/components/storefront/ProductCard';
import Link from 'next/link';

// Force dynamic rendering - this page queries the database
export const dynamic = 'force-dynamic';

async function getAllProducts(storeId: number) {
  const products = await query<{
    id: number;
    title: string;
    handle: string;
    status: string;
  }>(
    `SELECT p.id, p.title, p.handle, p.status
     FROM products p
     WHERE p.store_id = $1 AND p.status = 'active'
     ORDER BY p.created_at DESC`,
    [storeId]
  );

  // Get images and prices for each product
  const productsWithDetails = await Promise.all(
    products.map(async (product) => {
      const [image, variant] = await Promise.all([
        query<{ src: string }>(
          'SELECT src FROM product_images WHERE product_id = $1 ORDER BY position LIMIT 1',
          [product.id]
        ),
        query<{ price: number }>(
          'SELECT price FROM product_variants WHERE product_id = $1 ORDER BY position LIMIT 1',
          [product.id]
        ),
      ]);

      return {
        ...product,
        image: image[0]?.src || null,
        price: variant[0]?.price || 0,
      };
    })
  );

  return productsWithDetails;
}

export default async function ProductsPage() {
  const storeId = 1; // TODO: Get from domain/subdomain
  const products = await getAllProducts(storeId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">כל המוצרים</h1>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">אין מוצרים להצגה כרגע</p>
        </div>
      )}
    </div>
  );
}

