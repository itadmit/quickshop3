import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStoreIdBySlug } from '@/lib/utils/store';

// Get featured products (SSR)
async function getFeaturedProducts(storeId: number) {
  const products = await query<{
    id: number;
    title: string;
    handle: string;
    status: string;
  }>(
    `SELECT p.id, p.title, p.handle, p.status
     FROM products p
     WHERE p.store_id = $1 AND p.status = 'active'
     ORDER BY p.created_at DESC
     LIMIT 8`,
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

// Get collections (SSR)
async function getCollections(storeId: number) {
  const collections = await query<{
    id: number;
    title: string;
    handle: string;
    description: string | null;
    image_url: string | null;
  }>(
    `SELECT id, title, handle, description, image_url
     FROM product_collections
     WHERE store_id = $1 AND published_scope = 'web'
     ORDER BY created_at DESC
     LIMIT 6`,
    [storeId]
  );

  return collections;
}

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    return <div>חנות לא נמצאה</div>;
  }
  
  const [products, collections] = await Promise.all([
    getFeaturedProducts(storeId),
    getCollections(storeId),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ברוכים הבאים לחנות שלנו
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              מגוון רחב של מוצרים איכותיים במחירים מעולים
            </p>
            <Link
              href={`/shops/${storeSlug}/products`}
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              גלה את כל המוצרים
            </Link>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      {collections.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">קטגוריות</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/shops/${storeSlug}/collections/${collection.handle}`}
                  className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                >
                  {collection.image_url ? (
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      <img
                        src={collection.image_url}
                        alt={collection.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-lg">{collection.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <h3 className="text-white text-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {collection.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {products.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">מוצרים מובילים</h2>
              <Link
                href={`/shops/${storeSlug}/products`}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                צפה בכל המוצרים →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <section className="py-20 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-gray-500 text-lg mb-4">אין מוצרים להצגה כרגע</p>
            <p className="text-gray-400">החנות תהיה זמינה בקרוב</p>
          </div>
        </section>
      )}
    </div>
  );
}

