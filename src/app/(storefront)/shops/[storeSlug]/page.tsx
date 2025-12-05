import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getStoreIdBySlug, getStoreBySlug } from '@/lib/utils/store';
import { 
  getFeaturedProducts, 
  getNewArrivals, 
  getCollections,
  type ProductListItem,
  type CollectionItem 
} from '@/lib/storefront/queries';
import { getTranslations } from '@/lib/i18n/server';
import { getTemplateWithTranslations } from '@/lib/templates/service';

// ============================================
// Home Page - Optimized with Cache & Translations
// ============================================

export const revalidate = 300; // ISR - revalidate כל 5 דקות

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeId = await getStoreIdBySlug(storeSlug);
  
  if (!storeId) {
    notFound();
  }
  
  // טעינת פרטי החנות
  const store = await getStoreBySlug(storeSlug);
  if (!store) {
    notFound();
  }
  
  // System Translations
  const t = await getTranslations(store.locale || 'he-IL', 'storefront', storeId);
  
  // טעינה מקבילית עם Cache
  const [products, newArrivals, collections] = await Promise.all([
    getFeaturedProducts(storeId, 8),
    getNewArrivals(storeId, 8),
    getCollections(storeId, 6),
  ]);

  // Template Translations - Hero Section
  const heroTemplate = await getTemplateWithTranslations(
    'home-hero',
    storeId,
    store.locale || 'he-IL'
  );

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero Section - עם Template Translations */}
      <HeroSection 
        storeSlug={storeSlug} 
        translations={heroTemplate.translations}
        fallbackTitle={await t('home.title')}
        fallbackSubtitle={await t('home.subtitle')}
        fallbackCta={await t('home.cta')}
      />

      {/* Collections Section */}
      {collections.length > 0 && (
        <CollectionsSection 
          collections={collections} 
          storeSlug={storeSlug}
          title={await t('home.collections')}
          viewAll={await t('home.view_all')}
        />
      )}

      {/* Featured Products Section */}
      {products.length > 0 && (
        <FeaturedProductsSection 
          products={products} 
          storeSlug={storeSlug}
          title={await t('home.featured_products')}
          viewAll={await t('home.view_all')}
        />
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <FeaturedProductsSection 
          products={newArrivals} 
          storeSlug={storeSlug}
          title={await t('home.new_arrivals')}
          viewAll={await t('home.view_all')}
        />
      )}

      {/* Empty State */}
      {products.length === 0 && collections.length === 0 && (
        <EmptyState 
          emptyText={await t('home.empty_state')}
          comingSoon={await t('home.coming_soon')}
        />
      )}
    </div>
  );
}

// ============================================
// Components
// ============================================

interface HeroSectionProps {
  storeSlug: string;
  translations: Record<string, string>;
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackCta: string;
}

function HeroSection({ 
  storeSlug, 
  translations,
  fallbackTitle,
  fallbackSubtitle,
  fallbackCta
}: HeroSectionProps) {
  const title = translations.title || fallbackTitle;
  const subtitle = translations.subtitle || fallbackSubtitle;
  const ctaText = translations.cta_text || fallbackCta;
  
  return (
    <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {subtitle}
          </p>
          <Link
            href={`/shops/${storeSlug}/products`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}

interface CollectionsSectionProps {
  collections: CollectionItem[];
  storeSlug: string;
  title: string;
  viewAll: string;
}

function CollectionsSection({ 
  collections, 
  storeSlug,
  title,
  viewAll
}: CollectionsSectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{title}</h2>
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
                    loading="lazy"
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
              {collection.product_count !== undefined && (
                <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium">
                  {collection.product_count} מוצרים
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeaturedProductsSectionProps {
  products: ProductListItem[];
  storeSlug: string;
  title: string;
  viewAll: string;
}

function FeaturedProductsSection({
  products,
  storeSlug,
  title,
  viewAll,
}: FeaturedProductsSectionProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <Link
            href={`/shops/${storeSlug}/products`}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            {viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface EmptyStateProps {
  emptyText: string;
  comingSoon: string;
}

function EmptyState({ emptyText, comingSoon }: EmptyStateProps) {
  return (
    <section className="py-20 text-center">
      <div className="max-w-md mx-auto">
        <p className="text-gray-500 text-lg mb-4">{emptyText}</p>
        <p className="text-gray-400">{comingSoon}</p>
      </div>
    </section>
  );
}
