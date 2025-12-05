import { notFound } from 'next/navigation';
import { ProductViewTracker } from '@/components/storefront/ProductViewTracker';
import { ProductPageClient } from '@/components/storefront/ProductPageClient';
import { RelatedProducts } from '@/components/storefront/RelatedProducts';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { getProductByHandle, getProductsList, getProductCollections, type ProductListItem } from '@/lib/storefront/queries';
import { getTranslations } from '@/lib/i18n/server';

// ============================================
// Product Page - Optimized with Cache & Translations
// ============================================

export const revalidate = 3600; // ISR - revalidate כל שעה

export default async function ProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; handle: string }>;
}) {
  const { storeSlug, handle } = await params;
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

  // טעינת מוצר עם Batch Queries (מיטבי - אין N+1)
  const product = await getProductByHandle(handle, storeId);

  if (!product) {
    notFound();
  }

  const defaultVariant = product.variants[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      <ProductViewTracker
        productId={product.id}
        productTitle={product.title}
        price={defaultVariant.price}
      />
      
      {/* Product Page Client Component with Variant Selectors & URL Sync */}
      <ProductPageClient
        product={product}
        defaultVariant={defaultVariant}
        translations={{
          variantsLabel: await t('product.variants'),
          skuLabel: await t('product.sku'),
          inStockLabel: await t('product.in_stock'),
          outOfStockLabel: await t('product.out_of_stock'),
          availableLabel: await t('product.available'),
          priceLabel: await t('labels.price'),
          descriptionLabel: await t('product.description'),
          noImageText: await t('product.no_image'),
        }}
      />

      {/* Related Products */}
      <RelatedProductsSection 
        storeId={storeId}
        currentProductId={product.id}
        productCollections={await getProductCollections(product.id, storeId)}
      />
    </div>
  );
}

// Related Products Section Component
async function RelatedProductsSection({
  storeId,
  currentProductId,
  productCollections,
}: {
  storeId: number;
  currentProductId: number;
  productCollections: Array<{ id: number; title: string; handle: string }>;
}) {
  const t = await getTranslations('he-IL', 'storefront', storeId);
  
  // Get products from same collection (smart related products)
  let relatedProducts: ProductListItem[] = [];
  
  if (productCollections.length > 0) {
    // Take first collection and get products from it
    const collectionId = productCollections[0].id;
    relatedProducts = await getProductsList(storeId, {
      limit: 8,
      collectionId,
    });
  }
  
  // If no products from same collection, get random products
  if (relatedProducts.length === 0) {
    relatedProducts = await getProductsList(storeId, {
      limit: 8,
    });
  }

  // Filter out current product
  const filteredProducts = relatedProducts
    .filter(p => p.id !== currentProductId)
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.image,
      price: p.price,
    }));

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <RelatedProducts 
      products={filteredProducts}
      title={await t('product.related_products')}
    />
  );
}

// Old components removed - now using ProductPageClient component

