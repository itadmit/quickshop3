'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { emitTrackingEvent } from '@/lib/tracking/events';
import { useWishlist } from '@/hooks/useWishlist';

interface ColorOption {
  value: string;
  color?: string; // hex color code
}

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    handle: string;
    image: string | null;
    price: number | null;
    compare_at_price?: number | null;
    colors?: ColorOption[]; // Color swatches to display
  };
  storeSlug?: string;
  variant?: 'default' | 'minimal' | 'card'; // Style variant
}

export function ProductCard({ product, storeSlug: propStoreSlug, variant = 'minimal' }: ProductCardProps) {
  const params = useParams();
  const pathname = usePathname();
  const storeSlug = propStoreSlug || (params?.storeSlug as string) || '';
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const inWishlist = isInWishlist(product.id);
  
  // Track ViewContent when product card is viewed
  useEffect(() => {
    if (pathname?.includes('/products/') || pathname?.includes('/collections/') || pathname?.includes('/categories/')) {
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

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setWishlistLoading(false);
    }
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > (product.price || 0);

  // Style variants
  const containerStyles = {
    default: 'group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden',
    minimal: 'group overflow-hidden', // Clean, no shadow, no border
    card: 'group bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden',
  };

  return (
    <Link
      href={`/shops/${storeSlug}/products/${product.handle}`}
      className={containerStyles[variant]}
      onClick={() => {
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
      <div className="aspect-square bg-gray-50 relative overflow-hidden rounded-lg">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        
        {/* Sale Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
            מבצע
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
          className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 ${
            inWishlist
              ? 'bg-red-100 hover:bg-red-200'
              : 'bg-white/90 hover:bg-white shadow-sm'
          } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={inWishlist ? 'הסר מרשימת המשאלות' : 'הוסף לרשימת המשאלות'}
        >
          {inWishlist ? (
            <HiHeart className="w-4 h-4 text-red-500" />
          ) : (
            <HiOutlineHeart className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="pt-3 pb-1">
        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {product.colors.slice(0, 5).map((colorOption, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: colorOption.color || '#ccc' }}
                title={colorOption.value}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
            )}
          </div>
        )}
        
        <h3 className="font-medium text-gray-900 mb-1.5 group-hover:text-gray-700 transition-colors line-clamp-2 text-sm">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-gray-900">
            ₪{Number(product.price || 0).toFixed(2)}
          </p>
          {hasDiscount && (
            <p className="text-sm text-gray-400 line-through">
              ₪{Number(product.compare_at_price).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
