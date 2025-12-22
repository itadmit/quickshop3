'use client';

import { useState } from 'react';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showToast?: boolean;
  variant?: 'icon' | 'button';
}

export function WishlistButton({ 
  productId, 
  className,
  size = 'md',
  showToast = true,
  variant = 'icon'
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);
  
  const inWishlist = isInWishlist(productId);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const success = await toggleWishlist(productId);
      
      if (showToast && success) {
        // Toast notification - could integrate with a toast system
        const message = inWishlist 
          ? 'הוסר מרשימת המשאלות' 
          : 'נוסף לרשימת המשאלות';
        
        // Simple visual feedback for now
        console.log(message);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
          inWishlist
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {inWishlist ? (
          <HiHeart className={cn(iconSizes[size], "text-red-500")} />
        ) : (
          <HiOutlineHeart className={iconSizes[size]} />
        )}
        <span className="text-sm">
          {inWishlist ? 'ברשימת המשאלות' : 'הוסף לרשימה'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        sizeClasses[size],
        inWishlist
          ? "bg-red-100 hover:bg-red-200"
          : "bg-white/80 hover:bg-white shadow-md",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={inWishlist ? 'הסר מרשימת המשאלות' : 'הוסף לרשימת המשאלות'}
    >
      {inWishlist ? (
        <HiHeart className={cn(iconSizes[size], "text-red-500 transition-transform", isLoading && "animate-pulse")} />
      ) : (
        <HiOutlineHeart className={cn(iconSizes[size], "text-gray-600 hover:text-red-500 transition-colors", isLoading && "animate-pulse")} />
      )}
    </button>
  );
}

