'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AddToCartButton } from './AddToCartButton';
import { ProductVariantSelector } from './ProductVariantSelector';
import { ProductImageGallery } from './ProductImageGallery';

interface Variant {
  id: number;
  title: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  available: number;
}

interface ProductPageClientProps {
  product: {
    id: number;
    title: string;
    body_html: string | null;
    images: Array<{
      id: number;
      src: string;
      alt: string | null;
      position: number;
    }>;
    variants: Variant[];
    options?: Array<{
      id: number;
      name: string;
      type?: 'button' | 'color' | 'pattern' | 'image';
      position: number;
      values?: Array<{
        id: number;
        value: string;
        position: number;
        metadata?: {
          color?: string;
          image?: string;
          images?: string[];
          pattern?: string;
        };
      }>;
    }>;
  };
  defaultVariant: Variant;
  translations: {
    variantsLabel: string;
    skuLabel: string;
    inStockLabel: string;
    outOfStockLabel: string;
    availableLabel: string;
    priceLabel: string;
    descriptionLabel: string;
    noImageText: string;
  };
}

export function ProductPageClient({
  product,
  defaultVariant,
  translations,
}: ProductPageClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number>(defaultVariant.id);
  
  // Derive selectedVariant from selectedVariantId
  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || defaultVariant;

  const handleVariantChange = (variantId: number) => {
    setSelectedVariantId(variantId);
  };

  // Get image for selected variant (if variant has specific image)
  const selectedImage = product.images[0]?.src || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images - Everlane Style Gallery */}
      <ProductImageGallery
        images={product.images.map(img => ({ src: img.src, alt: img.alt || product.title }))}
        title={product.title}
        selectedVariant={selectedVariant.option1 || selectedVariant.option2 || undefined}
        noImageText={translations.noImageText}
      />

      {/* Product Info */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>

        {/* Price */}
        <ProductPrice 
          variant={selectedVariant}
          priceLabel={translations.priceLabel}
        />

        {/* Variant Selectors with URL Sync */}
        {product.variants.length > 1 && product.options && product.options.length > 0 && (
          <ProductVariantSelector
            variants={product.variants}
            options={product.options}
            onVariantChange={handleVariantChange}
            selectedVariantId={selectedVariantId}
          />
        )}

        {/* Add to Cart */}
        <div className="mb-8">
          <AddToCartButton
            productId={product.id}
            variantId={selectedVariant.id}
            productTitle={product.title}
            variantTitle={selectedVariant.title}
            price={selectedVariant.price}
            image={selectedImage}
            available={selectedVariant.available > 0}
            properties={
              product.options?.map((option, index) => ({
                name: option.name,
                value: selectedVariant[`option${index + 1}` as keyof Variant] as string || '',
              })).filter(p => p.value) || []
            }
          />
        </div>

        {/* Description */}
        {product.body_html && (
          <ProductDescription 
            bodyHtml={product.body_html}
            descriptionLabel={translations.descriptionLabel}
          />
        )}
      </div>
    </div>
  );
}

// Helper Components
function ProductPrice({ variant, priceLabel }: { variant: Variant; priceLabel: string }) {
  const hasDiscount = variant.compare_at_price && variant.compare_at_price > variant.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - variant.price / variant.compare_at_price!) * 100)
    : 0;

  return (
    <div className="mb-6">
      {hasDiscount ? (
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-900">
            ₪{Number(variant.price).toFixed(2)}
          </span>
          <span className="text-xl text-gray-500 line-through">
            ₪{Number(variant.compare_at_price || 0).toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-green-600">
            {discountPercent}% הנחה
          </span>
        </div>
      ) : (
        <span className="text-3xl font-bold text-gray-900">
          ₪{Number(variant.price).toFixed(2)}
        </span>
      )}
    </div>
  );
}

function ProductDescription({ bodyHtml, descriptionLabel }: { bodyHtml: string; descriptionLabel: string }) {
  return (
    <div className="border-t border-gray-200 pt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{descriptionLabel}</h3>
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}

