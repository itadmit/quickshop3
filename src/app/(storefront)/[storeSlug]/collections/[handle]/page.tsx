import { queryOne, query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import Link from 'next/link';

async function getCollection(handle: string, storeId: number) {
  const collection = await queryOne<{
    id: number;
    title: string;
    handle: string;
    description: string | null;
    image_url: string | null;
  }>(
    'SELECT id, title, handle, description, image_url FROM product_collections WHERE store_id = $1 AND handle = $2',
    [storeId, handle]
  );

  if (!collection) {
    return null;
  }

  // Get products in this collection
  const products = await query<{
    id: number;
    title: string;
    handle: string;
    status: string;
  }>(
    `SELECT p.id, p.title, p.handle, p.status
     FROM products p
     INNER JOIN product_collection_map pcm ON p.id = pcm.product_id
     WHERE pcm.collection_id = $1 AND p.status = 'active'
     ORDER BY p.created_at DESC`,
    [collection.id]
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

  return {
    ...collection,
    products: productsWithDetails,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
}) {
  const { storeSlug, handle } = await params;
  const { getStoreIdBySlug } = await import('@/lib/utils/store');
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    return <div>חנות לא נמצאה</div>;
  }

  const collection = await getCollection(handle, storeId);

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Collection Header */}
      <div className="mb-8">
        {collection.image_url && (
          <div className="mb-6">
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{collection.title}</h1>
        {collection.description && (
          <p className="text-lg text-gray-600">{collection.description}</p>
        )}
      </div>

      {/* Products Grid */}
      {collection.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">אין מוצרים בקטגוריה זו כרגע</p>
          <Link
            href={`/${storeSlug}/products`}
            className="inline-block text-green-600 hover:text-green-700 font-medium"
          >
            צפה בכל המוצרים →
          </Link>
        </div>
      )}
    </div>
  );
}

