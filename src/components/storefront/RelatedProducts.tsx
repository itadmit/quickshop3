'use client';

import { ProductCard } from './ProductCard';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSkeleton } from '@/components/ui/Skeleton';

interface Product {
  id: number;
  title: string;
  handle: string;
  image: string | null;
  price: number | null;
}

interface RelatedProductsProps {
  products: Product[];
  title?: string;
}

export function RelatedProducts({ products, title }: RelatedProductsProps) {
  const { t, loading: translationsLoading } = useTranslation('storefront');

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16" aria-label={title || (translationsLoading ? 'מוצרים קשורים' : t('product.related_products'))}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        {translationsLoading ? (
          <TextSkeleton width="w-48" height="h-7" />
        ) : (
          title || t('product.related_products')
        )}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

