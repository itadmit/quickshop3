import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getProductsList } from '@/lib/storefront/queries';
import { getTranslations } from '@/lib/i18n/server';
import Link from 'next/link';

// ============================================
// All Products Page - Default Category Page
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function AllProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { storeSlug } = await params;
  const { page, search } = await searchParams;
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

  // טעינת כל המוצרים
  const products = await getProductsList(storeId, {
    limit,
    offset,
    search: search || undefined,
  });

  // Count total (לצורך pagination)
  const totalResult = await import('@/lib/db').then(m => m.queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count
     FROM products p
     WHERE p.store_id = $1 AND p.status = 'active'
     ${search ? `AND (p.title ILIKE $2 OR p.body_html ILIKE $2 OR EXISTS (
       SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.sku IS NOT NULL AND pv.sku ILIKE $2
     ))` : ''}`,
    search ? [storeId, `%${search}%`] : [storeId]
  ));

  const total = totalResult ? parseInt(totalResult.count) : products.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('navigation.products')}</h1>

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
              search={search}
            />
          )}
        </>
      ) : (
        <EmptyProducts 
          emptyText={await t('home.empty_state')}
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
  search?: string;
}

function Pagination({ currentPage, totalPages, storeSlug, search }: PaginationProps) {
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

  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={`/shops/${storeSlug}/categories/all?page=${currentPage - 1}${searchParam}`}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הקודם
        </Link>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={`/shops/${storeSlug}/categories/all?page=${page}${searchParam}`}
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
          href={`/shops/${storeSlug}/categories/all?page=${currentPage + 1}${searchParam}`}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הבא
        </Link>
      )}
    </div>
  );
}

interface EmptyProductsProps {
  emptyText: string;
}

function EmptyProducts({ emptyText }: EmptyProductsProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">{emptyText}</p>
    </div>
  );
}

