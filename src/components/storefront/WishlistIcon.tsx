'use client';

import { HiHeart } from 'react-icons/hi';
import Link from 'next/link';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistIconProps {
  storeSlug: string;
  iconColor?: string;
}

/**
 * WishlistIcon - אייקון רשימת משאלות עם מונה
 * מציג את מספר הפריטים ברשימת המשאלות (גם למשתמשים רשומים וגם לאורחים)
 */
export function WishlistIcon({ storeSlug, iconColor = '#4B5563' }: WishlistIconProps) {
  const { getWishlistCount } = useWishlist();
  const wishlistCount = getWishlistCount();

  return (
    <Link
      href={`/shops/${storeSlug}/wishlist`}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100/50 transition-colors"
      style={{ color: iconColor }}
      aria-label="רשימת משאלות"
    >
      <HiHeart className="w-5 h-5" />
      {wishlistCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </span>
      )}
    </Link>
  );
}

