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
  
  if (!product) {
    return (
      <div className="py-8 px-4 text-center text-gray-400 bg-gray-50 rounded-lg">
        <HiPhotograph className="w-12 h-12 mx-auto mb-2" />
        <p>גלריית מוצר</p>
        <p className="text-sm">יוצג כאשר ייטען מוצר</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {images.length > 0 ? (
          <img 
            src={images[0].src || images[0].url || images[0]} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <HiPhotograph className="w-16 h-16" />
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && settings.show_thumbnails !== false && (
        <div className="flex gap-2 overflow-x-auto">
          {images.slice(0, 4).map((img: any, index: number) => (
            <div 
              key={index}
              className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-300 cursor-pointer"
            >
              <img 
                src={img.src || img.url || img} 
                alt={`${product.title} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
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
  
  if (!product) {
    return (
      <div className="py-4">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
        {settings.show_vendor !== false && (
          <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
        )}
      </div>
    );
  }

  const titleSize = (settings.title_size || 'large') as 'small' | 'medium' | 'large';
  const titleClass = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl md:text-4xl'
  }[titleSize];

  return (
    <div className="py-2">
      <h1 className={`${titleClass} font-bold text-gray-900`}>
        {product.title}
      </h1>
      {settings.show_vendor !== false && product.vendor && (
        <p className="text-sm text-gray-500 mt-1">{product.vendor}</p>
      )}
      {settings.show_sku && product.sku && (
        <p className="text-xs text-gray-400 mt-1">{t('product.sku')}: {product.sku}</p>
      )}
    </div>
  );
}

// Product Price Section
export function ProductPriceSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
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
    <div className="py-2 flex items-center gap-3">
      <span className="text-2xl font-bold text-gray-900">
        ₪{price.toFixed(2)}
      </span>
      
      {hasDiscount && settings.show_compare_price !== false && (
        <>
          <span className="text-lg text-gray-400 line-through">
            ₪{comparePrice.toFixed(2)}
          </span>
          {settings.show_discount_badge !== false && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
              -{discountPercent}%
            </span>
          )}
        </>
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
        
        // פתיחת העגלה אוטומטית אחרי הוספה (Quickshop)
        // מחכים קצת כדי שהעגלה תתעדכן מהשרת
        setTimeout(() => {
          openCart();
        }, 500);
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

