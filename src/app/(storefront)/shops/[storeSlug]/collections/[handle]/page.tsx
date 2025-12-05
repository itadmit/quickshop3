import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getCollectionByHandle } from '@/lib/storefront/queries';
import { getTranslations } from '@/lib/i18n/server';

// ============================================
// Collection Page - Optimized with Cache & Translations
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { storeSlug, handle } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

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

  // טעינת קטגוריה עם Cache ו-JOINs מיטביים
  const { collection, products, total } = await getCollectionByHandle(
    handle,
    storeId,
    { limit, offset }
  );

  if (!collection) {
    notFound();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      {/* Collection Header */}
      <div className="mb-8">
        {collection.image_url && (
          <div className="mb-6">
            <img
              src={collection.image_url}
              alt={collection.title}
              className="w-full h-64 object-cover rounded-lg"
              loading="eager"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{collection.title}</h1>
        {collection.description && (
          <p className="text-lg text-gray-600">{collection.description}</p>
        )}
        {collection.product_count !== undefined && (
          <p className="text-sm text-gray-500 mt-2">
            {collection.product_count} {await t('product.items')}
          </p>
        )}
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              storeSlug={storeSlug}
              handle={handle}
            />
          )}
        </>
      ) : (
        <EmptyCollection 
          storeSlug={storeSlug}
          viewAllText={await t('home.view_all')}
        />
      )}
    </div>
  );
}

// ============================================
// Components
// ============================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  storeSlug: string;
  handle: string;
}

function Pagination({ currentPage, totalPages, storeSlug, handle }: PaginationProps) {
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={`/shops/${storeSlug}/collections/${handle}?page=${currentPage - 1}`}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הקודם
        </Link>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={`/shops/${storeSlug}/collections/${handle}?page=${page}`}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-green-500 text-white border-green-500'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={`/shops/${storeSlug}/collections/${handle}?page=${currentPage + 1}`}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הבא
        </Link>
      )}
    </div>
  );
}

interface EmptyCollectionProps {
  storeSlug: string;
  viewAllText: string;
}

function EmptyCollection({ storeSlug, viewAllText }: EmptyCollectionProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg mb-4">אין מוצרים בקטגוריה זו כרגע</p>
      <Link
        href={`/shops/${storeSlug}/products`}
        className="inline-block text-green-600 hover:text-green-700 font-medium"
      >
        {viewAllText} →
      </Link>
    </div>
  );
}
