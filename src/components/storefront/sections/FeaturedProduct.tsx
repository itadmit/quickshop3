/**
 * Storefront - Featured Product Section Component
 * קומפוננטת מוצר מוצג
 */

import Link from 'next/link';
import Image from 'next/image';

interface FeaturedProductProps {
  settings: {
    heading?: string;
    subheading?: string;
    product_handle?: string;
    product_id?: number;
    show_price?: boolean;
    show_variants?: boolean;
    text_alignment?: 'right' | 'center' | 'left';
    container_type?: 'container_box' | 'full_width';
    background_color?: string;
  };
  blocks?: any[];
  globalSettings?: any;
}

export async function FeaturedProduct({ settings, blocks, globalSettings }: FeaturedProductProps) {
  // TODO: Fetch product from API based on product_handle or product_id
  const product: any = null;

  if (!product) {
    return null;
  }

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

        {/* Product Display */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">אין תמונה</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={textAlign}>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">{product.title}</h3>
            
            {product.description && (
              <div 
                className="text-gray-600 mb-6 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {settings.show_price && product.price && (
              <div className="text-3xl font-bold mb-6">
                ₪{product.price.toFixed(2)}
              </div>
            )}

            <Link
              href={`/products/${product.handle}`}
              className="inline-block px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              צפה במוצר
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

