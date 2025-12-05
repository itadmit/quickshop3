'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { emitTrackingEvent } from '@/lib/tracking/events';

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    handle: string;
    image: string | null;
    price: number | null;
  };
  storeSlug?: string; // Optional prop - if not provided, will try to get from params
}

export function ProductCard({ product, storeSlug: propStoreSlug }: ProductCardProps) {
  const params = useParams();
  const pathname = usePathname();
  // Use prop if provided, otherwise try to get from params
  const storeSlug = propStoreSlug || (params?.storeSlug as string) || '';
  
  // Track ViewContent when product card is viewed
  useEffect(() => {
    // רק אם זה בדף מוצר או בדף קטגוריה (לא בדף בית)
    if (pathname?.includes('/products/') || pathname?.includes('/collections/')) {
      emitTrackingEvent({
        event: 'ViewContent',
        content_type: 'product',
        content_ids: [String(product.id)],
        contents: [{
          id: String(product.id),
          quantity: 1,
          item_price: Number(product.price || 0),
        }],
        currency: 'ILS',
        value: Number(product.price || 0),
      });
    }
  }, [product.id, product.price, pathname]);

  return (
    <Link
      href={`/shops/${storeSlug}/products/${product.handle}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
      onClick={() => {
        // Track click on product
        emitTrackingEvent({
          event: 'ViewContent',
          content_type: 'product',
          content_ids: [String(product.id)],
          contents: [{
            id: String(product.id),
            quantity: 1,
            item_price: Number(product.price || 0),
          }],
          currency: 'ILS',
          value: Number(product.price || 0),
        });
      }}
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-24 h-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-gray-900">
          ₪{Number(product.price || 0).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
