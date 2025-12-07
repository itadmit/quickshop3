/**
 * Storefront - Product Grid Section Component
 * קומפוננטת גריד מוצרים
 */

import Link from 'next/link';
import Image from 'next/image';

interface ProductGridProps {
  settings: {
    heading?: string;
    subheading?: string;
    collection_handle?: string;
    products_count?: number;
    columns_per_row?: number;
    show_price?: boolean;
    text_alignment?: 'right' | 'center' | 'left';
    container_type?: 'container_box' | 'full_width';
    background_color?: string;
  };
  blocks?: any[];
  globalSettings?: any;
}

export async function ProductGrid({ settings, blocks, globalSettings }: ProductGridProps) {
  // TODO: Fetch products from API based on collection_handle or settings
  const products: Array<{
    id: number;
    handle: string;
    title: string;
    price: number;
    image_url?: string;
  }> = [];

  if (products.length === 0) {
    return null;
  }

  const colsPerRow = settings.columns_per_row || 4;
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }[colsPerRow] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  const textAlign = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[settings.text_alignment || 'right'] || 'text-right';

  const containerClass = settings.container_type === 'full_width' 
    ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' 
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <section 
      className="py-12 md:py-16"
      style={{ backgroundColor: settings.background_color || 'transparent' }}
    >
      <div className={containerClass}>
        {/* Heading */}
        {(settings.heading || settings.subheading) && (
          <div className={`mb-8 ${textAlign}`}>
            {settings.heading && (
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                {settings.heading}
              </h2>
            )}
            {settings.subheading && (
              <p className="text-lg text-gray-600">{settings.subheading}</p>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className={`grid ${gridCols} gap-6`}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.handle}`}
              className="group"
            >
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">אין תמונה</span>
                  </div>
                )}
              </div>
              
              <div className={textAlign}>
                <h3 className="font-semibold mb-1 group-hover:text-gray-600 transition-colors">
                  {product.title}
                </h3>
                {settings.show_price !== false && (
                  <p className="text-lg font-bold">₪{product.price.toFixed(2)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

