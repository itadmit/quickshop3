'use client';

import { useEffect, useState } from 'react';
import { useWishlist, WishlistItem } from '@/hooks/useWishlist';
import { HiHeart, HiShoppingCart, HiTrash, HiOutlineHeart } from 'react-icons/hi';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';

interface WishlistPageContentProps {
  storeId: number;
  storeSlug: string;
  storeName: string;
}

/**
 * WishlistPageContent - תוכן עמוד רשימת המשאלות
 * 
 * מציג את כל המוצרים שהמשתמש שמר לרשימת המשאלות
 * תומך הן במשתמשים רשומים והן באורחים (localStorage)
 */
export function WishlistPageContent({ storeId, storeSlug, storeName }: WishlistPageContentProps) {
  const { wishlistItems, isLoading, isLoggedIn, removeFromWishlist, getWishlistCount } = useWishlist();
  const { addToCart, isAddingToCart } = useCart();
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set());
  const [addingToCartItems, setAddingToCartItems] = useState<Set<number>>(new Set());

  const handleRemove = async (productId: number) => {
    setRemovingItems(prev => new Set(prev).add(productId));
    await removeFromWishlist(productId);
    setRemovingItems(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setAddingToCartItems(prev => new Set(prev).add(item.product_id));
    
    const success = await addToCart({
      variant_id: item.variant_id || item.product_id, // fallback to product_id if no variant
      product_id: item.product_id,
      product_title: item.product_title,
      variant_title: '',
      price: item.price,
      quantity: 1,
      image: item.image,
    });

    if (success) {
      // אפשר להסיר מהרשימה אחרי הוספה לעגלה (אופציונלי)
      // await removeFromWishlist(item.product_id);
    }

    setAddingToCartItems(prev => {
      const next = new Set(prev);
      next.delete(item.product_id);
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <HiOutlineHeart className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">רשימת המשאלות ריקה</h1>
            <p className="text-gray-600 mb-8">עדיין לא שמרת מוצרים לרשימת המשאלות שלך</p>
            <Link
              href={`/shops/${storeSlug}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              המשך לקניות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HiHeart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">רשימת המשאלות שלי</h1>
          </div>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'מוצר' : 'מוצרים'} ברשימה
            {!isLoggedIn && (
              <span className="mr-2 text-sm text-amber-600">
                (שמור מקומית - התחבר כדי לסנכרן בין מכשירים)
              </span>
            )}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const isRemoving = removingItems.has(item.product_id);
            const isAddingCart = addingToCartItems.has(item.product_id);
            
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden group transition-all duration-200 ${
                  isRemoving ? 'opacity-50 scale-95' : 'hover:shadow-md'
                }`}
              >
                {/* Product Image */}
                <Link href={`/shops/${storeSlug}/products/${item.product_handle}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.product_title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <HiOutlineHeart className="w-16 h-16" />
                    </div>
                  )}
                  
                  {/* Remove Button - Top Left */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(item.product_id);
                    }}
                    disabled={isRemoving}
                    className="absolute top-2 left-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    aria-label="הסר מרשימת המשאלות"
                  >
                    <HiTrash className="w-4 h-4 text-red-600" />
                  </button>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/shops/${storeSlug}/products/${item.product_handle}`}>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-gray-700 transition-colors">
                      {item.product_title}
                    </h3>
                  </Link>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-gray-900">
                      ₪{item.price.toFixed(2)}
                    </span>
                    {item.compare_price && item.compare_price > item.price && (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          ₪{item.compare_price.toFixed(2)}
                        </span>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          חסכון {Math.round(((item.compare_price - item.price) / item.compare_price) * 100)}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isAddingCart || isRemoving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingCart ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>מוסיף...</span>
                      </>
                    ) : (
                      <>
                        <HiShoppingCart className="w-5 h-5" />
                        <span>הוסף לעגלה</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href={`/shops/${storeSlug}/products`}
            className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            המשך לקניות
          </Link>
        </div>
      </div>
    </div>
  );
}

