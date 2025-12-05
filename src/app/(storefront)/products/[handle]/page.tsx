import { queryOne, query } from '@/lib/db';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/storefront/AddToCartButton';
import Image from 'next/image';

async function getProduct(handle: string, storeId: number) {
  const product = await queryOne<{
    id: number;
    title: string;
    handle: string;
    body_html: string | null;
    status: string;
  }>(
    'SELECT id, title, handle, body_html, status FROM products WHERE store_id = $1 AND handle = $2',
    [storeId, handle]
  );

  if (!product || product.status !== 'active') {
    return null;
  }

  // Get images
  const images = await query<{ id: number; src: string; alt: string | null; position: number }>(
    'SELECT id, src, alt, position FROM product_images WHERE product_id = $1 ORDER BY position',
    [product.id]
  );

  // Get variants
  const variants = await query<{
    id: number;
    title: string;
    price: number;
    compare_at_price: number | null;
    sku: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>(
    'SELECT id, title, price, compare_at_price, sku, option1, option2, option3 FROM product_variants WHERE product_id = $1 ORDER BY position',
    [product.id]
  );

  // Get inventory for each variant
  const variantsWithInventory = await Promise.all(
    variants.map(async (variant) => {
      const inventory = await queryOne<{ available: number }>(
        'SELECT available FROM variant_inventory WHERE variant_id = $1',
        [variant.id]
      );
      return {
        ...variant,
        available: inventory?.available || 0,
      };
    })
  );

  return {
    ...product,
    images,
    variants: variantsWithInventory,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const storeId = 1; // TODO: Get from domain/subdomain

  const product = await getProduct(handle, storeId);

  if (!product) {
    notFound();
  }

  const defaultVariant = product.variants[0];
  const defaultImage = product.images[0]?.src || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          {product.images.length > 0 ? (
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={product.images[0].src}
                  alt={product.images[0].alt || product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.slice(1, 5).map((image) => (
                    <div key={image.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt || product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">אין תמונה</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>

          {/* Price */}
          <div className="mb-6">
            {defaultVariant.compare_at_price && defaultVariant.compare_at_price > defaultVariant.price ? (
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  ₪{defaultVariant.price.toFixed(2)}
                </span>
                <span className="text-xl text-gray-500 line-through">
                  ₪{defaultVariant.compare_at_price.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {Math.round((1 - defaultVariant.price / defaultVariant.compare_at_price) * 100)}% הנחה
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                ₪{defaultVariant.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">אפשרויות:</h3>
              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{variant.title}</p>
                      {variant.sku && <p className="text-sm text-gray-500">מקט: {variant.sku}</p>}
                    </div>
                    <div className="text-left">
                      <p className="font-bold">₪{variant.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {variant.available > 0 ? `במלאי (${variant.available})` : 'אזל מהמלאי'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mb-8">
            <AddToCartButton
              productId={product.id}
              variantId={defaultVariant.id}
              productTitle={product.title}
              variantTitle={defaultVariant.title}
              price={defaultVariant.price}
              image={defaultImage}
              available={defaultVariant.available > 0}
            />
          </div>

          {/* Description */}
          {product.body_html && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">תיאור המוצר</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.body_html }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

