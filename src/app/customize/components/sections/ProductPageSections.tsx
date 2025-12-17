'use client';

import React, { memo, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { HiShoppingCart, HiPhotograph, HiTag, HiStar, HiCube } from 'react-icons/hi';
import { useCart } from '@/hooks/useCart';
import { useCartOpen } from '@/hooks/useCartOpen';
import { useProductPage } from '@/contexts/ProductPageContext';
import { DEMO_RELATED_PRODUCTS, DEMO_RECENTLY_VIEWED, DEMO_REVIEWS } from '@/lib/customizer/demoData';

interface ProductSectionProps {
  section: SectionSettings;
  product: any;
  onUpdate: (updates: Partial<SectionSettings>) => void;
  isPreview?: boolean; // true when in customizer
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

  // Thumbnail size classes
  const thumbnailSizeClasses = {
    small: 'w-[60px] h-[60px]',
    medium: 'w-[80px] h-[80px]',
    large: 'w-[100px] h-[100px]',
  }[thumbnailSize] || 'w-[80px] h-[80px]';

  // Image ratio classes
  const imageRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
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
            onClick={() => setSelectedImageIndex(index)}
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
    const mainContainerClass = isVertical ? 'flex gap-4' : 'flex flex-col gap-4';
    const orderClass = thumbnailPosition === 'left' || thumbnailPosition === 'top' ? 'order-2' : 'order-1';

    return (
      <div className={mainContainerClass}>
        {isVertical && thumbnailPosition === 'left' && renderThumbnails()}
        {!isVertical && thumbnailPosition === 'top' && renderThumbnails()}
        
        {/* Main Image */}
        <div className={`flex-1 ${orderClass}`}>
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
        </div>
        
        {isVertical && thumbnailPosition === 'right' && renderThumbnails()}
        {!isVertical && thumbnailPosition === 'bottom' && renderThumbnails()}
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
  
  // Get settings
  const titleSize = settings.title_size || 'large';
  const fontWeight = settings.font_weight || 'bold';
  const titleColor = settings.title_color || '#111827';
  const showVendor = settings.show_vendor !== false;
  const showSku = settings.show_sku === true;
  const showRating = settings.show_rating === true;
  const vendorColor = settings.vendor_color || '#6B7280';
  const textAlign = settings.text_align || 'right';

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
      <h1 
        className={`${titleSizeClasses} ${fontWeightClasses}`}
        style={{ color: titleColor }}
      >
        {product.title}
      </h1>
      
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

  return (
    <div className="py-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span 
          className={`${priceSizeClasses}`}
          style={{ color: priceColor, fontWeight }}
        >
          ₪{price.toFixed(2)}
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
  
  // Available check: variant has available > 0
  const available = effectiveVariant ? (effectiveVariant.available || 0) > 0 : false;
  
  const handleAddToCart = async () => {
    if (!available || !effectiveVariant || !product || isAddingToCart) return;
    
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
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={handleAddToCart}
        disabled={!available || isAddingToCart}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          buttonStyle === 'outline'
            ? 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
            : added
            ? 'bg-green-500 text-white'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        } ${!available || isAddingToCart ? 'opacity-50 cursor-not-allowed' : ''}`}
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
  
  if (!product) {
    return (
      <div className="py-4">
        <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('product.description') || 'תיאור המוצר'}
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

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">מידע נוסף</h3>
      <dl className="space-y-2">
        {customFields.map((field: any, index: number) => (
          <div key={index} className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">{field.key || field.name}</dt>
            <dd className="font-medium text-gray-900">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Product Reviews Section - Uses demo data ONLY in customizer preview (isPreview must be explicitly true)
export function ProductReviewsSection({ section, product, onUpdate, isPreview = false }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  // IMPORTANT: Only use demo data when isPreview is explicitly true (in customizer)
  const [reviews, setReviews] = React.useState<any[]>(isPreview === true ? DEMO_REVIEWS : []);
  const [loading, setLoading] = React.useState(isPreview !== true);
  const [averageRating, setAverageRating] = React.useState(isPreview === true ? 4.7 : 0);
  const loadedRef = React.useRef(isPreview === true); // Already loaded in preview mode

  // Only fetch from API in storefront mode (isPreview !== true)
  React.useEffect(() => {
    if (isPreview === true || loadedRef.current) return; // Skip if in preview or already loaded
    
    async function loadReviews() {
      if (!product?.id || product.id === 0) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/products/${product.id}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setAverageRating(data.average_rating || 0);
          loadedRef.current = true;
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadReviews();
  }, [product?.id, isPreview]);

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

// Related Products Section - Uses demo data ONLY in customizer preview (isPreview must be explicitly true)
export function RelatedProductsSection({ section, product, onUpdate, isPreview = false }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  // IMPORTANT: Only use demo data when isPreview is explicitly true (in customizer)
  const [relatedProducts, setRelatedProducts] = React.useState<any[]>(isPreview === true ? DEMO_RELATED_PRODUCTS : []);
  const [loading, setLoading] = React.useState(isPreview !== true);
  const loadedRef = React.useRef(false); // Track if already loaded
  
  const title = settings.title || t('product.related_products') || 'מוצרים שאולי יעניינו אותך';
  const productsCount = settings.products_count || 4;

  // In customizer preview (isPreview === true), use demo data immediately - no API calls
  React.useEffect(() => {
    // ONLY use demo data when explicitly in preview mode (customizer)
    if (isPreview === true) {
      if (!loadedRef.current) {
        setRelatedProducts(DEMO_RELATED_PRODUCTS);
        loadedRef.current = true;
      }
      setLoading(false);
      return;
    }
    
    // In storefront (isPreview !== true), load real data only once per product
    async function loadRelatedProducts() {
      if (!product?.id || product.id === 0 || loadedRef.current) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/products/${product.id}/related?limit=${productsCount}`);
        if (response.ok) {
          const data = await response.json();
          setRelatedProducts(data.products || []);
          loadedRef.current = true;
        }
      } catch (error) {
        console.error('Error loading related products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRelatedProducts();
  }, [product?.id, productsCount, isPreview]);

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

  // No related products - hide only in storefront (isPreview !== true)
  if (isPreview !== true && relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {relatedProducts.slice(0, productsCount).map((relProduct: any) => (
          <div 
            key={relProduct.id} 
            className="group cursor-pointer"
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:opacity-90 transition-opacity">
              {relProduct.image || relProduct.images?.[0]?.src ? (
                <img 
                  src={relProduct.image || relProduct.images?.[0]?.src} 
                  alt={relProduct.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <HiPhotograph className="w-12 h-12" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600">{relProduct.title}</p>
            <p className="text-sm text-gray-500">₪{parseFloat(relProduct.price || relProduct.variants?.[0]?.price || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recently Viewed Section - Uses demo data ONLY in customizer preview (isPreview must be explicitly true)
export function RecentlyViewedSection({ section, product, onUpdate, isPreview = false }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  const params = useParams();
  const storeSlug = params?.storeSlug as string || '';
  // IMPORTANT: Only use demo data when isPreview is explicitly true (in customizer)
  const [recentProducts, setRecentProducts] = React.useState<any[]>(isPreview === true ? DEMO_RECENTLY_VIEWED : []);
  const [loading, setLoading] = React.useState(isPreview !== true);
  const loadedRef = React.useRef(isPreview === true); // Already loaded in preview mode
  const savedRef = React.useRef(false); // Track if product was saved to localStorage
  
  const title = settings.title || t('product.recently_viewed') || 'צפית לאחרונה';
  const productsCount = settings.products_count || 4;

  // Only fetch from API in storefront mode (isPreview !== true)
  React.useEffect(() => {
    if (isPreview === true || loadedRef.current) return; // Skip if in preview or already loaded
    
    async function loadRecentlyViewed() {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      try {
        const recentlyViewedKey = 'quickshop_recently_viewed';
        const stored = localStorage.getItem(recentlyViewedKey);
        const viewedIds: number[] = stored ? JSON.parse(stored) : [];
        
        const filteredIds = viewedIds.filter(id => id !== product?.id && id !== 0).slice(0, productsCount);
        
        if (filteredIds.length === 0) {
          setLoading(false);
          loadedRef.current = true;
          return;
        }
        
        const response = await fetch(`/api/products/by-ids?ids=${filteredIds.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setRecentProducts(data.products || []);
          loadedRef.current = true;
        }
      } catch (error) {
        console.error('Error loading recently viewed products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRecentlyViewed();
  }, [product?.id, productsCount, isPreview]);

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
          <div 
            key={recentProduct.id} 
            className="group cursor-pointer"
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:opacity-90 transition-opacity">
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
          </div>
        ))}
      </div>
    </div>
  );
}

