'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiPencil, HiViewGrid, HiCog, HiCollection, HiX } from 'react-icons/hi';

interface AdminEditBarProps {
  productId?: number;
  productHandle?: string;
  collectionId?: number;
  collectionHandle?: string;
  storeSlug: string;
  storeId: number;
  pageType?: 'product' | 'collection' | 'page' | 'home';
}

export function AdminEditBar({ 
  productId, 
  productHandle, 
  collectionId,
  collectionHandle,
  storeSlug, 
  storeId, 
  pageType = 'product' 
}: AdminEditBarProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          // Check if user is admin of this store (by ID) OR super admin (store_id = 1 can access all)
          const userStoreId = data.store?.id;
          const isStoreAdmin = userStoreId === storeId;
          const isSuperAdmin = userStoreId === 1;
          
          if (isStoreAdmin || isSuperAdmin) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [storeId]);

  // Don't show anything while loading, not admin, or closed
  if (loading || !isAdmin || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed bar */}
      <div className="h-14" />
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 shadow-lg border-t"
        style={{ backgroundColor: '#111111', borderColor: '#05966a' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Right side - Label */}
            <div className="flex items-center gap-2 text-white text-sm">
              <HiCog className="w-4 h-4" style={{ color: '#18b982' }} />
              <span className="font-medium">מצב עריכה</span>
            </div>

            {/* Left side - Action buttons */}
            <div className="flex items-center gap-3">
              {/* Edit Product */}
              {pageType === 'product' && productId && (
                <Link
                  href={`/dashboard/products/${productId}`}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-sm font-medium text-white hover:scale-105"
                  style={{ backgroundColor: '#05966a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18b982'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#05966a'}
                >
                  <HiPencil className="w-4 h-4" />
                  <span>ערוך מוצר</span>
                </Link>
              )}

              {/* Edit Collection */}
              {pageType === 'collection' && collectionId && (
                <Link
                  href={`/dashboard/collections/${collectionId}`}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-sm font-medium text-white hover:scale-105"
                  style={{ backgroundColor: '#05966a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18b982'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#05966a'}
                >
                  <HiCollection className="w-4 h-4" />
                  <span>ערוך קטגוריה</span>
                </Link>
              )}

              {/* Customize Page */}
              <Link
                href={`/customize?storeId=${storeId}&pageType=${pageType}${
                  pageType === 'product' && productHandle ? `&pageHandle=${productHandle}` : ''
                }${
                  pageType === 'collection' && collectionHandle ? `&pageHandle=${collectionHandle}` : ''
                }`}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-sm font-medium border text-white hover:scale-105"
                style={{ borderColor: '#18b982', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#05966a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <HiViewGrid className="w-4 h-4" />
                <span>עצב עמוד</span>
              </Link>

              {/* Dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-sm font-medium text-white/70 hover:text-white"
              >
                <HiCog className="w-4 h-4" />
                <span>דשבורד</span>
              </Link>

              {/* Hide Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm font-medium border text-white/70 hover:text-white hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <HiX className="w-3.5 h-3.5" />
                <span>הסתר</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

