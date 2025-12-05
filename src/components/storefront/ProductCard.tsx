'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    handle: string;
    image: string | null;
    price: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  return (
    <Link
      href={`/shops/${storeSlug}/products/${product.handle}`}
      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-gray-900">
          ₪{product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

