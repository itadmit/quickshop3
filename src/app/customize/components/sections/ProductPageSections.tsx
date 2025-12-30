'use client';

import React, { memo, useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { HiShoppingCart, HiPhotograph, HiTag, HiStar, HiCube, HiHeart, HiOutlineHeart, HiExternalLink } from 'react-icons/hi';
import { useCart } from '@/hooks/useCart';
import { useCartOpen } from '@/hooks/useCartOpen';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductPage } from '@/contexts/ProductPageContext';
import { DEMO_RELATED_PRODUCTS, DEMO_RECENTLY_VIEWED, DEMO_REVIEWS } from '@/lib/customizer/demoData';
import { emitTrackingEvent } from '@/lib/tracking/events';
import { areSectionsEqual } from './sectionMemoUtils';
import { ProductCard } from '@/components/storefront/ProductCard';

interface ProductSectionProps {
  section: SectionSettings;
  product: any;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  isPreview?: boolean; // true when in customizer
  editorDevice?: 'desktop' | 'tablet' | 'mobile'; // Device type in customizer
  preloadedReviews?: any[]; // Preloaded reviews data (SSR)
  preloadedAverageRating?: number; // Preloaded average rating (SSR)
  preloadedProducts?: any[]; // Preloaded products data (SSR)
}

// Product Gallery Section
export function ProductGallerySection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const images = product?.images || [];
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  
  // Get settings
  const galleryLayout = settings.gallery_layout || 'thumbnails';
  const thumbnailPosition = settings.thumbnail_position || 'bottom';
  const thumbnailSize = settings.thumbnail_size || 'medium';
  const zoomEnabled = settings.zoom_enabled !== false;
  const imageRatio = settings.image_ratio || 'square';
  const showArrows = settings.show_arrows !== false;
  const showDots = settings.show_dots === true;
  const imageBorderRadius = settings.image_border_radius || '8px';

  // Thumbnail size classes
  const thumbnailSizeClasses = {
    small: 'w-[60px] h-[60px]',
    medium: 'w-[80px] h-[80px]',
    large: 'w-[100px] h-[100px]',
  }[thumbnailSize] || 'w-[80px] h-[80px]';

  // Image ratio classes - ✅ הוספת אפשרויות חדשות כולל סטורי
  const imageRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    story: 'aspect-[9/16]',
    wide: 'aspect-[16/9]',
    tall: 'aspect-[2/3]',
    ultra_wide: 'aspect-[21/9]',
    vertical: 'aspect-[9/16]',
    horizontal: 'aspect-[16/10]',
    original: '',
  }[imageRatio] || 'aspect-square';
  
  if (!product) {
    return (
      <div className="py-8 px-4 text-center text-gray-400 bg-gray-50 rounded-lg">
        <HiPhotograph className="w-12 h-12 mx-auto mb-2" />
        <p>גלריית מוצר</p>
        <p className="text-sm">יוצג כאשר ייטען מוצר</p>
      </div>
    );
  }

  const selectedImage = images[selectedImageIndex] || images[0];

  // Render thumbnails
  const renderThumbnails = () => {
    if (images.length <= 1 || settings.show_thumbnails === false) return null;
    
    const isVertical = thumbnailPosition === 'left' || thumbnailPosition === 'right';
    const containerClass = isVertical 
      ? 'flex flex-col gap-2 overflow-y-auto max-h-[500px]' 
      : 'flex gap-2 overflow-x-auto';

    return (
      <div className={containerClass}>
        {images.map((img: any, index: number) => (
          <button 
            key={index}
            onClick={() => {
              setSelectedImageIndex(index);
              // Track ViewProductGallery event
              emitTrackingEvent({
                event: 'ViewProductGallery',
                product_id: String(product?.id || 0),
                product_name: product?.title || '',
                image_index: index,
              });
            }}
            className={`${thumbnailSizeClasses} flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
              index === selectedImageIndex ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img 
              src={img.src || img.url || img} 
              alt={`${product.title} - ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    );
  };

  // Grid layout
  if (galleryLayout === 'grid') {
    const gridCols = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2';
    return (
      <div className={`grid ${gridCols} gap-2`}>
        {images.slice(0, 4).map((img: any, index: number) => (
          <div 
            key={index}
            className={`${imageRatioClasses} bg-gray-100 rounded-lg overflow-hidden ${index === 0 && images.length > 2 ? 'col-span-2' : ''}`}
          >
            <img 
              src={img.src || img.url || img} 
              alt={`${product.title} - ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  // Two columns layout
  if (galleryLayout === 'two_columns') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((img: any, index: number) => (
          <div 
            key={index}
            className={`${imageRatioClasses} bg-gray-100 rounded-lg overflow-hidden`}
          >
            <img 
              src={img.src || img.url || img} 
              alt={`${product.title} - ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  // Thumbnails layout (default) with position support
  if (galleryLayout === 'thumbnails') {
    const isVertical = thumbnailPosition === 'left' || thumbnailPosition === 'right';
    
    return (
      <div className={isVertical ? 'flex gap-4' : 'flex flex-col gap-4'}>
        {/* Show thumbnails BEFORE main image if position is 'left' or 'top' */}
        {thumbnailPosition === 'left' && renderThumbnails()}
        {thumbnailPosition === 'top' && renderThumbnails()}
        
        {/* Main Image */}
        <div className="flex-1">
          <div className={`${imageRatioClasses} bg-gray-100 overflow-hidden`} style={{ borderRadius: imageBorderRadius }}>
            {selectedImage ? (
              <img 
                src={selectedImage.src || selectedImage.url || selectedImage} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <HiPhotograph className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>
        
        {/* Show thumbnails AFTER main image if position is 'right' or 'bottom' */}
        {thumbnailPosition === 'right' && renderThumbnails()}
        {thumbnailPosition === 'bottom' && renderThumbnails()}
      </div>
    );
  }

  // Carousel/Single layout
  return (
    <div className="relative">
      {/* Main Image */}
      <div className={`${imageRatioClasses} bg-gray-100 rounded-lg overflow-hidden`}>
        {selectedImage ? (
          <img 
            src={selectedImage.src || selectedImage.url || selectedImage} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <HiPhotograph className="w-16 h-16" />
          </div>
        )}
      </div>
      
      {/* Navigation Arrows */}
      {showArrows && images.length > 1 && (
        <>
          <button 
            onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Dots */}
      {showDots && images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === selectedImageIndex ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Product Title Section
export function ProductTitleSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Get settings
  const titleSize = settings.title_size || 'large';
  const fontWeight = settings.font_weight || 'bold';
  const titleColor = settings.title_color || '#111827';
  const showVendor = settings.show_vendor !== false;
  const showSku = settings.show_sku === true;
  const showRating = settings.show_rating === true;
  const showWishlist = settings.show_wishlist !== false;
  const vendorColor = settings.vendor_color || '#6B7280';
  const textAlign = settings.text_align || 'right';
  
  // Wishlist state
  const inWishlist = product ? isInWishlist(product.id) : false;
  
  const handleWishlistClick = async () => {
    if (!product || wishlistLoading) return;
    setWishlistLoading(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Title size classes
  const titleSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl md:text-4xl',
    xlarge: 'text-4xl md:text-5xl',
  }[titleSize] || 'text-3xl md:text-4xl';

  // Font weight classes
  const fontWeightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    bold: 'font-bold',
  }[fontWeight] || 'font-bold';

  // Text align classes
  const textAlignClasses = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[textAlign] || 'text-right';
  
  if (!product) {
    return (
      <div className="py-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
        {showVendor && (
          <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={`py-2 ${textAlignClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <h1 
          className={`${titleSizeClasses} ${fontWeightClasses} flex-1`}
          style={{ color: titleColor }}
        >
          {product.title}
        </h1>
        
        {showWishlist && (
          <button
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              inWishlist
                ? 'bg-red-100 hover:bg-red-200'
                : 'bg-gray-100 hover:bg-gray-200'
            } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={inWishlist ? 'הסר מרשימת המשאלות' : 'הוסף לרשימת המשאלות'}
          >
            {inWishlist ? (
              <HiHeart className="w-5 h-5 text-red-500" />
            ) : (
              <HiOutlineHeart className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>
      
      {showVendor && product.vendor && (
        <p 
          className="text-sm mt-1"
          style={{ color: vendorColor }}
        >
          {product.vendor}
        </p>
      )}
      
      {showSku && product.sku && (
        <p className="text-xs text-gray-400 mt-1">
          {t('product.sku') || 'מק"ט'}: {product.sku}
        </p>
      )}
      
      {showRating && product.rating && (
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <HiStar 
              key={star}
              className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
          {product.reviews_count && (
            <span className="text-sm text-gray-500 mr-2">
              ({product.reviews_count})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Product Price Section
export function ProductPriceSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const storeSlug = params.storeSlug as string;
  
  // Premium club state
  const [premiumClub, setPremiumClub] = useState<{
    enabled: boolean;
    lowestTier?: { name: string; discount: { type: string; value: number } };
    signupUrl?: string;
  } | null>(null);
  
  // Fetch premium club config
  useEffect(() => {
    if (!storeSlug) return;
    
    fetch(`/api/storefront/${storeSlug}/premium-club`)
      .then(res => res.json())
      .then(data => setPremiumClub(data))
      .catch(() => setPremiumClub({ enabled: false }));
  }, [storeSlug]);
  
  // Get settings
  const priceSize = settings.price_size || 'large';
  const priceColor = settings.price_color || '#111827';
  const fontWeight = settings.font_weight || 'bold';
  const showComparePrice = settings.show_compare_price !== false;
  const comparePriceColor = settings.compare_price_color || '#9CA3AF';
  const showStrikethrough = settings.strikethrough !== false;
  const showDiscountBadge = settings.show_discount_badge !== false;
  const badgeStyle = settings.badge_style || 'rounded';
  const badgeBgColor = settings.badge_bg_color || '#FEE2E2';
  const badgeTextColor = settings.badge_text_color || '#DC2626';
  const showTaxInfo = settings.show_tax_info === true;
  const taxInfoText = settings.tax_info_text || 'כולל מע"מ';
  const showClubPrice = settings.show_club_price !== false; // Default: show

  // Price size classes
  const priceSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    xlarge: 'text-3xl md:text-4xl',
  }[priceSize] || 'text-2xl';

  // Badge style classes
  const badgeStyleClasses = {
    rounded: 'rounded-md',
    pill: 'rounded-full',
    square: 'rounded-none',
  }[badgeStyle] || 'rounded-md';
  
  // Try to use ProductPageContext if available (for variant selection)
  let selectedVariant = null;
  try {
    const context = useProductPage();
    selectedVariant = context.selectedVariant;
  } catch {
    // Context not available, use default variant
  }
  
  // Shopify logic: Every product has at least one variant
  // If no options, product has one variant (variants[0])
  // Price comes from selected variant (if context available) or default variant
  const variant = selectedVariant || product?.variants?.[0];
  const price = variant?.price ? Number(variant.price) : 0;
  const comparePrice = variant?.compare_at_price ? Number(variant.compare_at_price) : null;
  
  if (!product || !variant) {
    return (
      <div className="py-4">
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
      </div>
    );
  }

  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round((1 - price / comparePrice) * 100) : 0;

  // חישוב מחיר לחברי מועדון
  const clubPrice = useMemo(() => {
    if (!premiumClub?.enabled || !premiumClub.lowestTier?.discount) return null;
    
    const discount = premiumClub.lowestTier.discount;
    if (discount.type === 'PERCENTAGE') {
      return price * (1 - discount.value / 100);
    } else {
      return Math.max(0, price - discount.value);
    }
  }, [price, premiumClub]);

  return (
    <div className="py-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-gray-600 text-base">מחיר:</span>
        <span 
          className={`${priceSizeClasses}`}
          style={{ color: priceColor, fontWeight }}
        >
          {price.toFixed(2)} ₪
        </span>
        
        {hasDiscount && showComparePrice && (
          <>
            <span 
              className={`text-lg ${showStrikethrough ? 'line-through' : ''}`}
              style={{ color: comparePriceColor }}
            >
              ₪{comparePrice.toFixed(2)}
            </span>
            {showDiscountBadge && (
              <span 
                className={`px-2 py-1 text-sm font-medium ${badgeStyleClasses}`}
                style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
              >
                -{discountPercent}%
              </span>
            )}
          </>
        )}
      </div>
      
      {/* מחיר לחברי מועדון */}
      {showClubPrice && premiumClub?.enabled && clubPrice !== null && clubPrice < price && (
        <div className="mt-2 inline-block px-2 py-1.5 bg-green-50 border border-green-200 rounded text-sm">
          <div className="flex items-center gap-1.5 text-green-700 flex-wrap">
            <span className="text-sm">
              לחברי מועדון: <span className="font-semibold">{clubPrice.toFixed(2)} ₪</span>
              {premiumClub.lowestTier?.discount && (
                <span className="text-green-600 mr-1">
                  ({premiumClub.lowestTier.discount.type === 'PERCENTAGE' 
                    ? `${premiumClub.lowestTier.discount.value}% הנחה`
                    : `₪${premiumClub.lowestTier.discount.value} הנחה`})
                </span>
              )}
            </span>
            {premiumClub.signupUrl && (
              <span className="text-green-600">
                <Link href={premiumClub.signupUrl} className="hover:text-green-800 underline">
                  הצטרפות
                </Link>
                {' | '}
                <Link href={premiumClub.signupUrl} className="hover:text-green-800 underline">
                  התחברות
                </Link>
              </span>
            )}
          </div>
        </div>
      )}
      
      {showTaxInfo && (
        <p className="text-sm text-gray-500 mt-1">{taxInfoText}</p>
      )}
    </div>
  );
}

// Product Variants Section
export function ProductVariantsSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  const options = product?.options || [];
  const variants = product?.variants || [];
  
  // Try to use ProductPageContext if available
  let setSelectedVariantId: ((id: number) => void) | null = null;
  let selectedVariantId: number | null = null;
  try {
    const context = useProductPage();
    setSelectedVariantId = context.setSelectedVariantId;
    selectedVariantId = context.selectedVariantId;
  } catch {
    // Context not available, will use local state
  }
  
  // Shopify logic: Every product has at least one variant
  // If no options, product has one variant (variants[0]) - don't show variant selector
  // Only show variant selector if there are multiple variants AND options
  if (!product || !variants || variants.length === 0) {
    return (
      <div className="py-4 px-4 bg-gray-50 rounded-lg text-center text-gray-400">
        <HiCube className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{t('product.variants') || 'וריאציות'}</p>
        <p className="text-xs">יוצג כאשר למוצר יש אפשרויות</p>
      </div>
    );
  }

  // Hide variant selector if only one variant (Shopify behavior)
  if (variants.length === 1 || !options || options.length === 0) {
    return null; // Don't show variant selector for single variant products
  }
  
  // Local state if context not available
  const [localSelectedVariantId, setLocalSelectedVariantId] = React.useState<number | null>(
    selectedVariantId || variants[0]?.id || null
  );
  
  const effectiveSelectedVariantId = selectedVariantId ?? localSelectedVariantId;
  const effectiveSetSelectedVariantId = setSelectedVariantId || setLocalSelectedVariantId;
  
  const selectedVariant = variants.find((v: any) => v.id === effectiveSelectedVariantId) || variants[0];

  const variantStyle = settings.variant_style || 'buttons';

  // Helper function to extract value recursively from nested JSON
  const extractValueRecursively = (val: any, depth = 0): string => {
    if (depth > 5) return ''; // Prevent infinite recursion
    if (!val) return '';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          if (parsed && typeof parsed === 'object' && parsed.value !== undefined) {
            return extractValueRecursively(parsed.value, depth + 1);
          }
          if (parsed && typeof parsed === 'object') {
            return extractValueRecursively(parsed.value || parsed.label || parsed.name || val, depth + 1);
          }
          return String(parsed);
        } catch {
          return val;
        }
      }
      return val;
    }
    if (val && typeof val === 'object') {
      if (val.value !== undefined) {
        return extractValueRecursively(val.value, depth + 1);
      }
      return extractValueRecursively(val.label || val.name || '', depth + 1);
    }
    return '';
  };

  // Helper to get variant option value
  const getVariantOptionValue = (variant: any, position: number): string | null => {
    if (position === 0) return variant.option1;
    if (position === 1) return variant.option2;
    if (position === 2) return variant.option3;
    return null;
  };

  return (
    <div className="py-4 space-y-4">
      {options.map((option: any, index: number) => (
        <div key={option.id || index}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {option.name}
          </label>
          
          {variantStyle === 'dropdown' ? (
            <select 
              value={getVariantOptionValue(selectedVariant, index) || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                // Find variant with this option value
                const newVariant = variants.find((v: any) => {
                  const currentValue = getVariantOptionValue(v, index);
                  return currentValue === newValue;
                });
                if (newVariant) {
                  effectiveSetSelectedVariantId(newVariant.id);
                  // Track SelectVariant event
                  emitTrackingEvent({
                    event: 'SelectVariant',
                    product_id: String(product?.id || 0),
                    variant_id: String(newVariant.id),
                    variant_title: newVariant.title || '',
                    price: parseFloat(newVariant.price || 0),
                    currency: 'ILS',
                  });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {option.values?.map((value: any, vIndex: number) => {
                const cleanValue = extractValueRecursively(value.value || value);
                return (
                  <option key={vIndex} value={cleanValue}>
                    {cleanValue}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="flex flex-wrap gap-2">
              {option.values?.slice(0, 6).map((value: any, vIndex: number) => {
                const cleanValue = extractValueRecursively(value.value || value);
                const isSelected = getVariantOptionValue(selectedVariant, index) === cleanValue;
                return (
                  <button
                    key={vIndex}
                    onClick={() => {
                      // Find variant with this option value
                      const newVariant = variants.find((v: any) => {
                        const currentValue = getVariantOptionValue(v, index);
                        return currentValue === cleanValue;
                      });
                      if (newVariant) {
                        effectiveSetSelectedVariantId(newVariant.id);
                        // Track SelectVariant event
                        emitTrackingEvent({
                          event: 'SelectVariant',
                          product_id: String(product?.id || 0),
                          variant_id: String(newVariant.id),
                          variant_title: newVariant.title || '',
                          price: parseFloat(newVariant.price || 0),
                          currency: 'ILS',
                        });
                      }
                    }}
                    className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'border-gray-900 bg-gray-900 text-white' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cleanValue}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Product Add to Cart Section
export function ProductAddToCartSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  // Try to use ProductPageContext if available
  let contextQuantity = 1;
  let setContextQuantity: ((qty: number) => void) | null = null;
  let selectedVariant: any = null;
  let selectedVariantId: number | null = null;
  
  try {
    const context = useProductPage();
    contextQuantity = context.quantity;
    setContextQuantity = context.setQuantity;
    selectedVariant = context.selectedVariant;
    selectedVariantId = context.selectedVariantId;
  } catch {
    // Context not available, use local state
  }
  
  // Shopify logic: Every product has at least one variant
  const variants = product?.variants || [];
  const defaultVariant = variants[0];
  
  // Use context variant if available, otherwise use default
  const effectiveVariant = selectedVariant || defaultVariant;
  const effectiveVariantId = selectedVariantId || defaultVariant?.id || null;
  
  // Local state if context not available
  const [localQuantity, setLocalQuantity] = React.useState(1);
  const quantity = contextQuantity || localQuantity;
  const setQuantity = setContextQuantity || setLocalQuantity;
  
  // Use hooks for real functionality
  const { addToCart, isAddingToCart } = useCart();
  const { openCart } = useCartOpen();
  const [added, setAdded] = React.useState(false);
  
  const buttonText = settings.button_text || t('product.add_to_cart') || 'הוסף לסל';
  const buyNowText = settings.buy_now_text || t('product.buy_now') || 'קנה עכשיו';
  const buttonStyle = settings.button_style || 'solid';
  const buttonBgColor = settings.button_bg_color || '#111827'; // gray-900
  const buttonTextColor = settings.button_text_color || '#FFFFFF';
  const buttonRadius = settings.button_radius || '8px';
  
  // Available check: variant has available > 0
  const available = effectiveVariant ? (effectiveVariant.available || 0) > 0 : false;
  const inventoryQuantity = effectiveVariant?.available || 0;
  
  const handleAddToCart = async () => {
    if (!available || !effectiveVariant || !product || isAddingToCart) return;
    
    // בדיקת מלאי לפני הוספה
    if (quantity > inventoryQuantity) {
      alert(`רק ${inventoryQuantity} יחידות זמינות במלאי`);
      return;
    }
    
    try {
      // הוספה לעגלה
      const success = await addToCart({
        variant_id: effectiveVariant.id,
        product_id: product.id,
        product_title: product.title,
        variant_title: effectiveVariant.title || 'Default Title',
        price: Number(effectiveVariant.price),
        quantity,
        image: product.images?.[0]?.src || undefined,
        properties: product.options?.map((option: any, index: number) => ({
          name: option.name,
          value: effectiveVariant[`option${index + 1}` as keyof typeof effectiveVariant] as string || '',
        })).filter((p: any) => p.value) || [],
      });
      
      // רק אם ההוספה הצליחה
      if (success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        
        // פתיחת העגלה מיד - ה-state גלובלי ומתעדכן בזמן אמת
        openCart();
      } else {
        console.error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // לא פותחים את העגלה אם יש שגיאה
    }
  };

  if (!product || !defaultVariant) {
    return (
      <div className="py-4">
        <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-3">
      {settings.show_quantity_selector !== false && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t('product.quantity') || 'כמות'}:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 hover:bg-gray-100"
            >
              -
            </button>
            <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">{quantity}</span>
            <button 
              onClick={() => {
                if (quantity < inventoryQuantity) {
                  setQuantity(quantity + 1);
                }
              }}
              disabled={quantity >= inventoryQuantity}
              className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          {inventoryQuantity > 0 && inventoryQuantity <= 5 && (
            <span className="text-sm text-orange-600">
              נותרו {inventoryQuantity} במלאי
            </span>
          )}
        </div>
      )}
      
      <button
        onClick={handleAddToCart}
        disabled={!available || isAddingToCart}
        className={`w-full py-3 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${
          !available || isAddingToCart ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: added ? '#10b981' : (buttonStyle === 'outline' ? 'transparent' : buttonBgColor),
          color: buttonStyle === 'outline' ? buttonBgColor : buttonTextColor,
          border: buttonStyle === 'outline' ? `2px solid ${buttonBgColor}` : 'none',
          borderRadius: buttonRadius,
        }}
      >
        {isAddingToCart ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            מוסיף...
          </>
        ) : added ? (
          <>
            <HiShoppingCart className="w-5 h-5" />
            {buttonText} ✓
          </>
        ) : (
          <>
            <HiShoppingCart className="w-5 h-5" />
            {available ? buttonText : (t('product.out_of_stock') || 'אזל מהמלאי')}
          </>
        )}
      </button>
      
      {settings.show_buy_now !== false && available && (
        <button className="w-full py-3 px-6 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          {buyNowText}
        </button>
      )}
    </div>
  );
}

// Product Description Section
export function ProductDescriptionSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  const description = product?.body_html || product?.description || '';
  const displayStyle = settings.display_style || 'open'; // open, accordion, tabs
  const title = settings.title || t('product.description') || 'תיאור המוצר';
  const [isOpen, setIsOpen] = React.useState(displayStyle === 'open');
  
  if (!product) {
    return (
      <div className="py-4">
        <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
      </div>
    );
  }

  // Accordion style
  if (displayStyle === 'accordion') {
    return (
      <div className="py-4 border-t border-gray-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 py-3 hover:text-gray-700 transition-colors"
        >
          <span>{title}</span>
          <svg
            className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="py-3">
            {description ? (
              <div 
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-gray-400 text-sm">אין תיאור למוצר זה</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Tabs style - for now showing as open, can be enhanced with multiple tabs
  if (displayStyle === 'tabs') {
    return (
      <div className="py-4">
        <div className="border-b border-gray-200">
          <button className="px-6 py-3 border-b-2 border-gray-900 font-semibold text-gray-900">
            {title}
          </button>
        </div>
        <div className="py-4">
          {description ? (
            <div 
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="text-gray-400 text-sm">אין תיאור למוצר זה</p>
          )}
        </div>
      </div>
    );
  }

  // Default: open style
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      {description ? (
        <div 
          className="prose prose-sm max-w-none text-gray-600"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : (
        <p className="text-gray-400 text-sm">אין תיאור למוצר זה</p>
      )}
    </div>
  );
}

// Product Custom Fields Section
export function ProductCustomFieldsSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  
  const customFields = product?.metafields || product?.custom_fields || [];
  
  // Placeholder for customizer preview only (when no product loaded)
  if (!product) {
    return (
      <div className="py-4 px-4 bg-gray-50 rounded-lg text-center text-gray-400">
        <HiTag className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">שדות מותאמים</p>
        <p className="text-xs">יוצג כאשר למוצר יש שדות נוספים</p>
      </div>
    );
  }

  // In storefront: if product exists but has no custom fields, don't show anything
  if (customFields.length === 0) {
    return null;
  }

  // Check if value is a file URL (PDF, image, etc.)
  const isFileUrl = (value: string) => {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    return lowerValue.startsWith('http') && (
      lowerValue.includes('.pdf') ||
      lowerValue.includes('.doc') ||
      lowerValue.includes('.docx') ||
      lowerValue.includes('.xls') ||
      lowerValue.includes('.xlsx') ||
      lowerValue.includes('/uploads/files/') ||
      lowerValue.includes('/files/')
    );
  };

  // Check if value is a PDF
  const isPdfUrl = (value: string) => {
    if (!value) return false;
    return value.toLowerCase().includes('.pdf');
  };

  // Get file name from URL
  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      // Decode URL encoded characters
      return decodeURIComponent(fileName);
    } catch {
      return url.split('/').pop() || 'קובץ';
    }
  };

  // Render field value based on type
  const renderFieldValue = (field: any) => {
    const value = field.value;
    const valueType = field.value_type;

    // If value_type is 'file' or 'url', or if the value looks like a file URL
    if (valueType === 'file' || valueType === 'url' || isFileUrl(value)) {
      const fileName = getFileName(value);
      const isPdf = isPdfUrl(value);
      
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 ${
            isPdf ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPdf ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          ) : (
            <HiExternalLink className="w-5 h-5" />
          )}
          <span>{field.key === 'label_pdf' || field.key === 'תווית' ? 'לצפייה בתווית' : 'לצפייה בקובץ'}</span>
        </a>
      );
    }

    // Check if it's a URL (but not a file)
    if (valueType === 'url' || (value && value.startsWith('http'))) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
        >
          {value}
          <HiExternalLink className="w-4 h-4" />
        </a>
      );
    }

    // Check if it's a color
    if (valueType === 'color' && value && value.startsWith('#')) {
      return (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-gray-200" 
            style={{ backgroundColor: value }}
          />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      );
    }

    // Check if it's a checkbox/boolean
    if (valueType === 'checkbox' || valueType === 'boolean') {
      return (
        <span className={`font-medium ${value === 'true' || value === true ? 'text-green-600' : 'text-red-600'}`}>
          {value === 'true' || value === true ? 'כן' : 'לא'}
        </span>
      );
    }

    // Default: show as text
    return <span className="font-medium text-gray-900">{value}</span>;
  };

  // Separate file fields from regular fields
  const fileFields = customFields.filter((field: any) => 
    field.value_type === 'file' || isFileUrl(field.value)
  );
  const regularFields = customFields.filter((field: any) => 
    field.value_type !== 'file' && !isFileUrl(field.value)
  );

  return (
    <div className="py-4 space-y-4">
      {/* File buttons - displayed prominently */}
      {fileFields.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {fileFields.map((field: any, index: number) => (
            <div key={`file-${index}`}>
              {renderFieldValue(field)}
            </div>
          ))}
        </div>
      )}

      {/* Regular fields - displayed as list */}
      {regularFields.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">מידע נוסף</h3>
          <dl className="space-y-2">
            {regularFields.map((field: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <dt className="text-gray-500">{field.key || field.name}</dt>
                <dd>{renderFieldValue(field)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

// Product Reviews Section - Uses demo data ONLY in customizer preview (isPreview must be explicitly true)
function ProductReviewsSectionComponent({ section, product, onUpdate, isPreview = false, preloadedReviews, preloadedAverageRating }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  // ✅ בדיקה מפורשת אם יש נתונים מראש (גם מערך ריק נחשב לנתונים!)
  const hasPreloadedData = preloadedReviews !== undefined;
  
  // IMPORTANT: Only use demo data when isPreview is explicitly true (in customizer)
  // ✅ אם יש נתונים טעונים מראש (SSR) - השתמש בהם!
  const [reviews, setReviews] = React.useState<any[]>(
    isPreview === true ? DEMO_REVIEWS : (preloadedReviews || [])
  );
  const [loading, setLoading] = React.useState(
    isPreview !== true && !hasPreloadedData // רק אם אין נתונים טעונים מראש
  );
  const [averageRating, setAverageRating] = React.useState(
    isPreview === true ? 4.7 : (preloadedAverageRating || 0)
  );

  // Only fetch from API in storefront mode (isPreview !== true) if no preloaded data
  React.useEffect(() => {
    // ✅ בדיקה מפורשת - אם יש נתונים מראש, לא טוענים שוב!
    if (isPreview === true) {
      console.log(`⭐ [ProductReviews] Preview mode - using demo data`);
      return;
    }
    
    if (hasPreloadedData) {
      console.log(`⭐ [ProductReviews] Using preloaded data (${preloadedReviews?.length || 0} reviews)`);
      setLoading(false);
      return;
    }
    
    async function loadReviews() {
      if (!product?.id || product.id === 0) {
        setLoading(false);
        return;
      }
      
      console.log(`⭐ [ProductReviews] Loading from API for product ${product.id}`);
      try {
        const response = await fetch(`/api/products/${product.id}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setAverageRating(data.average_rating || 0);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadReviews();
  }, [product?.id, isPreview, hasPreloadedData]);

  // Loading state (only in storefront)
  if (loading) {
    return (
      <div className="py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {t('product.reviews') || 'ביקורות'}
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // In storefront (isPreview !== true): if product exists but has no reviews, don't show the section
  if (isPreview !== true && reviews.length === 0) {
    return null;
  }

  const roundedRating = Math.round(averageRating * 10) / 10;

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('product.reviews') || 'ביקורות'}
      </h3>
      
      {settings.show_rating_summary !== false && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
          <div className="text-4xl font-bold text-gray-900">{roundedRating}</div>
          <div>
            <div className="flex items-center gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar key={star} className={`w-5 h-5 ${star <= averageRating ? 'fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-500">מבוסס על {reviews.length} ביקורות</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <HiStar key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString('he-IL')}
              </span>
            </div>
            {review.title && <p className="font-medium text-gray-900 mb-1">{review.title}</p>}
            <p className="text-gray-700 text-sm">{review.content}</p>
            <p className="text-xs text-gray-400 mt-2">- {review.customer_name || 'לקוח מאומת'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Memoize ProductReviewsSection to prevent re-renders
export const ProductReviewsSection = React.memo(ProductReviewsSectionComponent, (prevProps, nextProps) => {
  // Use areSectionsEqual for deep comparison of section
  if (!areSectionsEqual(prevProps.section, nextProps.section)) {
    return false; // Will re-render
  }
  
  // Compare product (by ID)
  if (prevProps.product?.id !== nextProps.product?.id) {
    return false; // Will re-render
  }
  
  // Compare isPreview
  if (prevProps.isPreview !== nextProps.isPreview) {
    return false; // Will re-render
  }
  
  // onUpdate is intentionally ignored
  return true; // Skip re-render
});

// Related Products Section - Uses demo data ONLY in customizer preview (isPreview must be explicitly true)
function RelatedProductsSectionComponent({ section, product, onUpdate, isPreview = false, editorDevice = 'desktop', preloadedProducts }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  // ✅ בדיקה מפורשת אם יש נתונים מראש (גם מערך ריק נחשב לנתונים!)
  const hasPreloadedData = preloadedProducts !== undefined;
  
  // IMPORTANT: Only use demo data when isPreview is explicitly true (in customizer)
  // ✅ אם יש נתונים טעונים מראש (SSR) - השתמש בהם!
  const [relatedProducts, setRelatedProducts] = React.useState<any[]>(
    isPreview === true ? DEMO_RELATED_PRODUCTS : (preloadedProducts || [])
  );
  const [loading, setLoading] = React.useState(
    isPreview !== true && !hasPreloadedData // רק אם אין נתונים טעונים מראש
  );
  
  const title = settings.title || t('product.related_products') || 'מוצרים שאולי יעניינו אותך';
  
  // Get responsive settings
  const layoutStyle = settings.layout_style || 'grid';
  const columnsDesktop = settings.columns_desktop || 4;
  const columnsMobile = settings.columns_mobile || 2;
  const productsCountDesktop = settings.products_count || 4;
  const productsCountMobile = settings.products_count_mobile || productsCountDesktop;
  const cardBorderRadius = settings.card_border_radius ? `${settings.card_border_radius}px` : undefined;
  const imageRatio = settings.image_ratio || 'square';
  
  // ✅ SSR-safe: Use editorDevice prop (default to desktop for storefront)
  const isMobile = editorDevice === 'mobile';
  const productsCount = isMobile ? productsCountMobile : productsCountDesktop;

  // In customizer preview (isPreview === true), use demo data immediately - no API calls
  React.useEffect(() => {
    // ONLY use demo data when explicitly in preview mode (customizer)
    if (isPreview === true) {
      console.log(`🔗 [RelatedProducts] Preview mode - using demo data`);
      setRelatedProducts(DEMO_RELATED_PRODUCTS);
      setLoading(false);
      return;
    }
    
    // ✅ אם יש נתונים טעונים מראש - אל תטען שוב! (גם אם מערך ריק)
    if (hasPreloadedData) {
      console.log(`🔗 [RelatedProducts] Using preloaded data (${preloadedProducts?.length || 0} products)`);
      setLoading(false);
      return;
    }
    
    // In storefront (isPreview !== true), load real data only once per product
    async function loadRelatedProducts() {
      if (!product?.id || product.id === 0) {
        setLoading(false);
        return;
      }
      
      console.log(`🔗 [RelatedProducts] Loading from API for product ${product.id}`);
      try {
        // Use storeSlug for storefront access (no auth required)
        const url = storeSlug 
          ? `/api/products/${product.id}/related?limit=${productsCount}&storeSlug=${storeSlug}`
          : `/api/products/${product.id}/related?limit=${productsCount}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setRelatedProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error loading related products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRelatedProducts();
  }, [product?.id, productsCount, isPreview, hasPreloadedData]);

  // Get grid columns classes based on settings
  const getGridCols = () => {
    const mobileCols = columnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';
    let desktopCols = 'md:grid-cols-4';
    switch (columnsDesktop) {
      case 2: desktopCols = 'md:grid-cols-2'; break;
      case 3: desktopCols = 'md:grid-cols-3'; break;
      case 5: desktopCols = 'md:grid-cols-5'; break;
      case 6: desktopCols = 'md:grid-cols-6'; break;
      default: desktopCols = 'md:grid-cols-4';
    }
    return `${mobileCols} ${desktopCols}`;
  };

  // Loading state (only in storefront)
  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
        <div className={`grid ${getGridCols()} gap-4`}>
          {Array.from({ length: productsCount }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2" style={{ borderRadius: cardBorderRadius }} />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No related products - hide only in storefront (isPreview !== true)
  if (isPreview !== true && relatedProducts.length === 0) {
    return null;
  }

  // Filter out products that are out of stock
  const availableProducts = relatedProducts.filter((p: any) => 
    p.availability !== 'out_of_stock'
  ).slice(0, productsCount);

  // Carousel layout
  if (layoutStyle === 'carousel') {
    const itemsToShow = isMobile ? columnsMobile : columnsDesktop;
    return (
      <div className="py-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
        {availableProducts.length === 0 ? (
          <p className="text-gray-500 text-sm">אין מוצרים זמינים להצגה</p>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                {availableProducts.map((relProduct: any) => {
                  const cardWidth = isMobile 
                    ? `calc((100vw - 2rem) / ${columnsMobile})`
                    : `calc((100vw - 4rem) / ${columnsDesktop})`;
                  return (
                    <div
                      key={relProduct.id}
                      className="flex-shrink-0"
                      style={{ 
                        width: cardWidth,
                        scrollSnapAlign: 'start'
                      }}
                    >
                      <ProductCard
                        product={{
                          id: relProduct.id,
                          title: relProduct.title,
                          handle: relProduct.handle,
                          image: relProduct.image || relProduct.images?.[0]?.src || null,
                          price: parseFloat(relProduct.price || relProduct.variants?.[0]?.price || 0),
                          compare_at_price: relProduct.compare_price ? parseFloat(relProduct.compare_price) : undefined,
                          availability: relProduct.availability,
                          inventory_qty: relProduct.inventory_qty,
                          rating: relProduct.rating ? parseFloat(relProduct.rating) : undefined,
                        }}
                        storeSlug={storeSlug}
                        showRating={settings.show_rating !== false}
                        showBadges={settings.show_badges !== false}
                        imageRatio={imageRatio}
                        style={cardBorderRadius ? { borderRadius: cardBorderRadius } : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="py-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      {availableProducts.length === 0 ? (
        <p className="text-gray-500 text-sm">אין מוצרים זמינים להצגה</p>
      ) : (
        <div className={`grid ${getGridCols()} gap-4`}>
          {availableProducts.map((relProduct: any) => (
            <ProductCard
              key={relProduct.id}
              product={{
                id: relProduct.id,
                title: relProduct.title,
                handle: relProduct.handle,
                image: relProduct.image || relProduct.images?.[0]?.src || null,
                price: parseFloat(relProduct.price || relProduct.variants?.[0]?.price || 0),
                compare_at_price: relProduct.compare_price ? parseFloat(relProduct.compare_price) : undefined,
                availability: relProduct.availability,
                inventory_qty: relProduct.inventory_qty,
                rating: relProduct.rating ? parseFloat(relProduct.rating) : undefined,
              }}
              storeSlug={storeSlug}
              showRating={settings.show_rating !== false}
              showBadges={settings.show_badges !== false}
              imageRatio={imageRatio}
              style={cardBorderRadius ? { borderRadius: cardBorderRadius } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Recently Viewed Section - Uses demo data ONLY in customizer preview (isPreview must be explicitly true)
function RecentlyViewedSectionComponent({ section, product, onUpdate, isPreview = false, preloadedProducts }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  
  // ✅ בדיקה מפורשת אם יש נתונים מראש (גם מערך ריק נחשב לנתונים!)
  const hasPreloadedData = preloadedProducts !== undefined;
  
  // IMPORTANT: Only use demo data when isPreview is explicitly true (in customizer)
  // ✅ אם יש נתונים טעונים מראש (SSR) - השתמש בהם!
  const [recentProducts, setRecentProducts] = React.useState<any[]>(
    isPreview === true ? DEMO_RECENTLY_VIEWED : (preloadedProducts || [])
  );
  const [loading, setLoading] = React.useState(
    isPreview !== true && !hasPreloadedData // רק אם אין נתונים טעונים מראש
  );
  const savedRef = React.useRef(false); // Track if product was saved to localStorage
  
  const title = settings.title || t('product.recently_viewed') || 'צפית לאחרונה';
  const productsCount = settings.products_count || 4;
  const imageRatio = settings.image_ratio || 'square';

  // Image ratio class mapping
  const imageRatioClasses: Record<string, string> = {
    'square': 'aspect-square',
    'portrait': 'aspect-[3/4]',
    'landscape': 'aspect-[4/3]',
    'story': 'aspect-[9/16]',
    'wide': 'aspect-[16/9]',
    'tall': 'aspect-[2/3]',
    'ultra_wide': 'aspect-[21/9]',
    'vertical': 'aspect-[9/16]',
    'horizontal': 'aspect-[16/10]',
    'original': 'aspect-auto',
  };

  const aspectClass = imageRatioClasses[imageRatio] || 'aspect-square';

  // Only fetch from API in storefront mode (isPreview !== true) if no preloaded data
  React.useEffect(() => {
    // ONLY use demo data when explicitly in preview mode (customizer)
    if (isPreview === true) {
      console.log(`👁️ [RecentlyViewed] Preview mode - using demo data`);
      setLoading(false);
      return;
    }
    
    // ✅ אם יש נתונים טעונים מראש - אל תטען שוב! (גם אם מערך ריק)
    if (hasPreloadedData) {
      console.log(`👁️ [RecentlyViewed] Using preloaded data (${preloadedProducts?.length || 0} products)`);
      setLoading(false);
      return;
    }
    
    async function loadRecentlyViewed() {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      console.log(`👁️ [RecentlyViewed] Loading from localStorage/API`);
      try {
        const recentlyViewedKey = 'quickshop_recently_viewed';
        const stored = localStorage.getItem(recentlyViewedKey);
        const viewedIds: number[] = stored ? JSON.parse(stored) : [];
        
        const filteredIds = viewedIds.filter(id => id !== product?.id && id !== 0).slice(0, productsCount);
        
        if (filteredIds.length === 0) {
          setLoading(false);
          return;
        }
        
        // Use storeSlug for storefront access (no auth required)
        const url = storeSlug 
          ? `/api/products/by-ids?ids=${filteredIds.join(',')}&storeSlug=${storeSlug}`
          : `/api/products/by-ids?ids=${filteredIds.join(',')}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setRecentProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error loading recently viewed products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRecentlyViewed();
  }, [product?.id, productsCount, isPreview, hasPreloadedData]);

  // Save current product to recently viewed (only in storefront, once - never in preview)
  React.useEffect(() => {
    if (isPreview === true || savedRef.current) return; // Don't save in preview mode or if already saved
    if (typeof window === 'undefined' || !product?.id || product.id === 0) return;
    
    const recentlyViewedKey = 'quickshop_recently_viewed';
    const stored = localStorage.getItem(recentlyViewedKey);
    let viewedIds: number[] = stored ? JSON.parse(stored) : [];
    
    viewedIds = viewedIds.filter(id => id !== product.id);
    viewedIds.unshift(product.id);
    viewedIds = viewedIds.slice(0, 10);
    
    localStorage.setItem(recentlyViewedKey, JSON.stringify(viewedIds));
    savedRef.current = true;
  }, [product?.id, isPreview]);

  // Loading state (only in storefront)
  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No recently viewed products - hide only in storefront (isPreview !== true)
  if (isPreview !== true && recentProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentProducts.slice(0, productsCount).map((recentProduct: any) => (
          <Link
            key={recentProduct.id}
            href={`/shops/${storeSlug}/products/${recentProduct.handle}`}
            className="group cursor-pointer block"
          >
            <div className={`${aspectClass} bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:opacity-90 transition-opacity`}>
              {recentProduct.image || recentProduct.images?.[0]?.src ? (
                <img 
                  src={recentProduct.image || recentProduct.images?.[0]?.src} 
                  alt={recentProduct.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <HiPhotograph className="w-12 h-12" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600">{recentProduct.title}</p>
            <p className="text-sm text-gray-500">₪{parseFloat(recentProduct.price || recentProduct.variants?.[0]?.price || 0).toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Memoize RelatedProductsSection to prevent re-renders
export const RelatedProductsSection = React.memo(RelatedProductsSectionComponent, (prevProps, nextProps) => {
  // Use areSectionsEqual for deep comparison of section
  if (!areSectionsEqual(prevProps.section, nextProps.section)) {
    return false; // Will re-render
  }
  
  // Compare product (by ID)
  if (prevProps.product?.id !== nextProps.product?.id) {
    return false; // Will re-render
  }
  
  // Compare isPreview
  if (prevProps.isPreview !== nextProps.isPreview) {
    return false; // Will re-render
  }
  
  // onUpdate is intentionally ignored
  return true; // Skip re-render
});

// Memoize RecentlyViewedSection to prevent re-renders
export const RecentlyViewedSection = React.memo(RecentlyViewedSectionComponent, (prevProps, nextProps) => {
  // Use areSectionsEqual for deep comparison of section
  if (!areSectionsEqual(prevProps.section, nextProps.section)) {
    return false; // Will re-render
  }
  
  // Compare product (by ID)
  if (prevProps.product?.id !== nextProps.product?.id) {
    return false; // Will re-render
  }
  
  // Compare isPreview
  if (prevProps.isPreview !== nextProps.isPreview) {
    return false; // Will re-render
  }
  
  // onUpdate is intentionally ignored
  return true; // Skip re-render
});

