'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiHeart, HiOutlineHeart, HiShoppingCart, HiEye, HiStar } from 'react-icons/hi';
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
    vendor?: string;
    rating?: number;
  };
  storeSlug?: string;
  variant?: 'default' | 'minimal' | 'card'; // Style variant
  priority?: boolean; // For eager loading above the fold
  // Display settings
  showPrice?: boolean;
  showComparePrice?: boolean;
  showWishlist?: boolean;
  showBadges?: boolean;
  showColorSwatches?: boolean;
  showVendor?: boolean;
  showRating?: boolean;
  showQuickView?: boolean;
  showAddToCart?: boolean;
  // Style settings
  showShadow?: boolean;
  showBorder?: boolean;
  imageRatio?: string; // 'square' | 'portrait' | 'landscape' | 'story' | 'wide' | 'tall' | 'horizontal' | 'vertical'
}

export function ProductCard({ 
  product, 
  storeSlug: propStoreSlug, 
  variant = 'minimal', 
  priority = false,
  showPrice = true,
  showComparePrice = true,
  showWishlist = true,
  showBadges = true,
  showColorSwatches = true,
  showVendor = false,
  showRating = false,
  showQuickView = false,
  showAddToCart = false,
  showShadow = false,
  showBorder = false,
  imageRatio = 'square',
}: ProductCardProps) {
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement add to cart
    console.log('Add to cart:', product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement quick view modal
    console.log('Quick view:', product.id);
  };

  const hasDiscount = product.compare_at_price && product.compare_at_price > (product.price || 0);

  // Build container classes based on settings
  const getContainerClasses = () => {
    const classes = ['group', 'overflow-hidden', 'rounded-lg'];
    
    if (showShadow) {
      classes.push('shadow-md', 'hover:shadow-xl', 'transition-shadow');
    }
    
    if (showBorder) {
      classes.push('border', 'border-gray-200', 'hover:border-gray-300');
    }
    
    if (variant === 'card' || showShadow || showBorder) {
      classes.push('bg-white');
    }
    
    return classes.join(' ');
  };

  // Image ratio classes
  const imageRatioClasses: Record<string, string> = {
    'square': 'aspect-square',        // 1:1
    'portrait': 'aspect-[3/4]',       // 3:4
    'landscape': 'aspect-[4/3]',      // 4:3
    'story': 'aspect-[9/16]',         // 9:16
    'wide': 'aspect-[16/9]',          // 16:9
    'tall': 'aspect-[2/3]',           // 2:3
    'ultra_wide': 'aspect-[21/9]',    // 21:9
    'vertical': 'aspect-[9/16]',      // 9:16
    'horizontal': 'aspect-[16/10]',   // 16:10
    'original': 'aspect-auto',        // Original ratio
  };

  const aspectClass = imageRatioClasses[imageRatio] || 'aspect-square';

  return (
    <Link
      href={`/shops/${storeSlug}/products/${product.handle}`}
      prefetch={true}
      className={getContainerClasses()}
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
      <div className={`${aspectClass} bg-gray-50 relative overflow-hidden rounded-lg`}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading={priority ? "eager" : "lazy"}
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
        {showBadges && hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
            מבצע
          </div>
        )}
        
        {/* Action Buttons - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Wishlist Button */}
          {showWishlist && (
            <button
              onClick={handleWishlistClick}
              disabled={wishlistLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
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
          )}
          
          {/* Quick View Button */}
          {showQuickView && (
            <button
              onClick={handleQuickView}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all duration-200"
              aria-label="צפייה מהירה"
            >
              <HiEye className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Add to Cart Button - Bottom */}
        {showAddToCart && (
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleAddToCart}
              className="w-full py-2 bg-black/90 hover:bg-black text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <HiShoppingCart className="w-4 h-4" />
              הוסף לסל
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="pt-3 pb-1 px-1">
        {/* Color Swatches */}
        {showColorSwatches && product.colors && product.colors.length > 0 && (
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
        
        {/* Vendor */}
        {showVendor && product.vendor && (
          <p className="text-xs text-gray-500 mb-1">{product.vendor}</p>
        )}
        
        <h3 className="font-medium text-gray-900 mb-1.5 group-hover:text-gray-700 transition-colors line-clamp-2 text-sm">
          {product.title}
        </h3>
        
        {/* Rating */}
        {showRating && (
          <div className="flex items-center gap-1 mb-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <HiStar 
                key={star} 
                className={`w-3.5 h-3.5 ${star <= (product.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-xs text-gray-500">({product.rating || 4}.0)</span>
          </div>
        )}
        
        {showPrice && (
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-gray-900">
              ₪{Number(product.price || 0).toFixed(2)}
            </p>
            {showComparePrice && hasDiscount && (
              <p className="text-sm text-gray-400 line-through">
                ₪{Number(product.compare_at_price).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
