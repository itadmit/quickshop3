import { query } from '@/lib/db';
import Link from 'next/link';

async function getAllCollections(storeId: number) {
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
     ORDER BY created_at DESC`,
    [storeId]
  );

  return collections;
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const { getStoreIdBySlug } = await import('@/lib/utils/store');
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    return <div>חנות לא נמצאה</div>;
  }
  
  const collections = await getAllCollections(storeId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">קטגוריות</h1>

      {collections.length > 0 ? (
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
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center h-64">
                  <span className="text-gray-500 text-xl">{collection.title}</span>
                </div>
              )}
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{collection.title}</h3>
                {collection.description && (
                  <p className="text-gray-600 text-sm">{collection.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">אין קטגוריות להצגה כרגע</p>
        </div>
      )}
    </div>
  );
}

