'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPackage, HiCheckCircle2 } from 'react-icons/hi';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: number;
  name: string;
  slug: string | null;
  price: number;
  compare_price: number | null;
  images: string[] | null;
  description: string | null;
  inventory_qty: number;
  availability: string;
  variant_id?: number; // Default variant ID
}

interface Page {
  id: number;
  title: string;
  handle: string;
  display_type: 'GRID' | 'LIST' | null;
  coupon_code: string | null;
}

interface ChoicesOfPageClientProps {
  page: Page;
  products: Product[];
  storeSlug: string;
}

export function ChoicesOfPageClient({ page, products, storeSlug }: ChoicesOfPageClientProps) {
  const { cart, addToCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getProductPrice = (product: Product) => {
    return {
      price: product.price,
      comparePrice: product.compare_price,
    };
  };

  const handleAddToCart = async (product: Product) => {
    try {
      // If we don't have variant_id, we need to fetch it first
      let variantId = product.variant_id;
      
      if (!variantId) {
        // Fetch the first variant for this product
        const response = await fetch(`/api/products/${product.id}/variants`);
        if (response.ok) {
          const data = await response.json();
          const variants = data.variants || [];
          if (variants.length > 0) {
            variantId = variants[0].id;
          }
        }
      }
      
      if (!variantId) {
        console.error('No variant found for product:', product.id);
        return;
      }
      
      const success = await addToCart({
        variant_id: variantId,
        product_id: product.id,
        product_title: product.name,
        variant_title: 'Default Title',
        price: product.price,
        quantity: 1,
        image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      });
      
      if (!success) {
        console.error('Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const isCouponActive = mounted && page.coupon_code && cart?.couponCode === page.coupon_code;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
        
        {/* Coupon Alert */}
        {isCouponActive && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <HiCheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0" />
              <span className="text-green-800 font-medium text-sm">
                קוד הנחה {page.coupon_code} הופעל בעגלה שלך
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Products Display */}
      {page.display_type === 'LIST' ? (
        <div className="space-y-3">
          {products.map((product) => {
            const priceInfo = getProductPrice(product);
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-row gap-2 sm:gap-4">
                  <Link
                    href={`/shops/${storeSlug}/products/${product.slug || product.id}`}
                    className="flex-shrink-0 w-32 sm:w-48 h-full relative overflow-hidden bg-gray-100"
                  >
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiPackage className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 p-2 sm:p-4 flex flex-col justify-between">
                    <div>
                      <Link href={`/shops/${storeSlug}/products/${product.slug || product.id}`}>
                        <h3 className="text-sm sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 hover:text-emerald-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs sm:text-base text-gray-600 mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2 hidden sm:block">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-4">
                        {priceInfo.comparePrice && priceInfo.comparePrice > priceInfo.price ? (
                          <>
                            <span className="text-base sm:text-2xl font-bold text-gray-900">
                              {formatPrice(priceInfo.price)}
                            </span>
                            <span className="text-xs sm:text-lg text-gray-500 line-through">
                              {formatPrice(priceInfo.comparePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-base sm:text-2xl font-bold text-gray-900">
                            {formatPrice(priceInfo.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full sm:w-auto sm:flex-1 text-xs sm:text-base h-8 sm:h-10 px-2 sm:px-4"
                      >
                        הוסף לעגלה
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="w-full sm:w-auto sm:flex-1 text-xs sm:text-base h-8 sm:h-10 px-2 sm:px-4"
                      >
                        <Link href={`/shops/${storeSlug}/products/${product.slug || product.id}`}>
                          צפה במוצר
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const priceInfo = getProductPrice(product);
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <Link
                  href={`/shops/${storeSlug}/products/${product.slug || product.id}`}
                  className="block relative overflow-hidden bg-gray-100 aspect-square"
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiPackage className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link href={`/shops/${storeSlug}/products/${product.slug || product.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-emerald-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-4">
                    {priceInfo.comparePrice && priceInfo.comparePrice > priceInfo.price ? (
                      <>
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(priceInfo.price)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(priceInfo.comparePrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(priceInfo.price)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      הוסף לעגלה
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full"
                    >
                      <Link href={`/shops/${storeSlug}/products/${product.slug || product.id}`}>
                        צפה במוצר
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-12">
          <HiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">אין מוצרים להצגה</p>
        </div>
      )}
    </div>
  );
}

