'use client';

import React from 'react';
import { SectionSettings } from '@/lib/customizer/types';
import { useTranslation } from '@/hooks/useTranslation';
import { HiShoppingCart, HiPhotograph, HiTag, HiStar, HiCube } from 'react-icons/hi';

interface ProductSectionProps {
  section: SectionSettings;
  product: any;
  onUpdate: (updates: Partial<SectionSettings>) => void;
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

  const titleSize = settings.title_size || 'large';
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
  
  const price = product?.price || product?.variants?.[0]?.price || 0;
  const comparePrice = product?.compare_at_price || product?.variants?.[0]?.compare_at_price;
  
  if (!product) {
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
  
  if (!product || options.length === 0) {
    return (
      <div className="py-4 px-4 bg-gray-50 rounded-lg text-center text-gray-400">
        <HiCube className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{t('product.variants') || 'וריאציות'}</p>
        <p className="text-xs">יוצג כאשר למוצר יש אפשרויות</p>
      </div>
    );
  }

  const variantStyle = settings.variant_style || 'buttons';

  return (
    <div className="py-4 space-y-4">
      {options.map((option: any, index: number) => (
        <div key={option.id || index}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {option.name}
          </label>
          
          {variantStyle === 'dropdown' ? (
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              {option.values?.map((value: any, vIndex: number) => (
                <option key={vIndex} value={value.value || value}>
                  {value.value || value}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex flex-wrap gap-2">
              {option.values?.slice(0, 6).map((value: any, vIndex: number) => (
                <button
                  key={vIndex}
                  className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                    vIndex === 0 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {value.value || value}
                </button>
              ))}
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
  
  const buttonText = settings.button_text || t('product.add_to_cart') || 'הוסף לסל';
  const buyNowText = settings.buy_now_text || t('product.buy_now') || 'קנה עכשיו';
  const buttonStyle = settings.button_style || 'solid';
  
  const available = product?.available !== false && product?.variants?.[0]?.available !== 0;

  return (
    <div className="py-4 space-y-3">
      {settings.show_quantity_selector !== false && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t('product.quantity') || 'כמות'}:
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button className="px-3 py-2 hover:bg-gray-100">-</button>
            <span className="px-4 py-2 border-x border-gray-300">1</span>
            <button className="px-3 py-2 hover:bg-gray-100">+</button>
          </div>
        </div>
      )}
      
      <button
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          buttonStyle === 'outline'
            ? 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        } ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!available}
      >
        <HiShoppingCart className="w-5 h-5" />
        {available ? buttonText : (t('product.out_of_stock') || 'אזל מהמלאי')}
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
  
  if (!product || customFields.length === 0) {
    return (
      <div className="py-4 px-4 bg-gray-50 rounded-lg text-center text-gray-400">
        <HiTag className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">שדות מותאמים</p>
        <p className="text-xs">יוצג כאשר למוצר יש שדות נוספים</p>
      </div>
    );
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

// Product Reviews Section
export function ProductReviewsSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('product.reviews') || 'ביקורות'}
      </h3>
      
      {settings.show_rating_summary !== false && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
          <div className="text-4xl font-bold text-gray-900">4.5</div>
          <div>
            <div className="flex items-center gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar key={star} className={`w-5 h-5 ${star <= 4 ? 'fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-500">מבוסס על 12 ביקורות</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar key={star} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-sm text-gray-500">לפני 3 ימים</span>
          </div>
          <p className="text-gray-700 text-sm">מוצר מעולה! איכות גבוהה ומשלוח מהיר.</p>
          <p className="text-xs text-gray-400 mt-2">- לקוח מאומת</p>
        </div>
      </div>
    </div>
  );
}

// Related Products Section
export function RelatedProductsSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const { t } = useTranslation('storefront');
  
  const title = settings.title || t('product.related_products') || 'מוצרים קשורים';
  
  return (
    <div className="py-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <HiPhotograph className="w-12 h-12" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">מוצר לדוגמה {i}</p>
            <p className="text-sm text-gray-500">₪99.00</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recently Viewed Section
export function RecentlyViewedSection({ section, product, onUpdate }: ProductSectionProps) {
  const settings = section.settings || {};
  const title = settings.title || 'נצפו לאחרונה';
  
  return (
    <div className="py-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <HiPhotograph className="w-12 h-12" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">מוצר נצפה {i}</p>
            <p className="text-sm text-gray-500">₪79.00</p>
          </div>
        ))}
      </div>
    </div>
  );
}

