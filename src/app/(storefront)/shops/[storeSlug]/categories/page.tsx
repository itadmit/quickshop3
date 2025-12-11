import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getCollections } from '@/lib/storefront/queries';
import { getTranslations } from '@/lib/i18n/server';

// ============================================
// Categories Page - Optimized with Cache & Translations
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }

  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }

  // System Translations
  const t = await getTranslations(store.locale || 'he-IL', 'storefront', storeId);

  // טעינת קטגוריות עם Cache
  const collections = await getCollections(storeId, 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('home.collections')}</h1>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/shops/${storeSlug}/categories/${collection.handle}`}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
            >
              {collection.image_url ? (
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={collection.image_url}
                    alt={collection.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
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
                  <p className="text-gray-600 text-sm mb-2">{collection.description}</p>
                )}
                {collection.product_count !== undefined && (
                  <p className="text-sm text-gray-500">
                    {collection.product_count} {t('product.items')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('home.empty_state')}</p>
        </div>
      )}
    </div>
  );
}



