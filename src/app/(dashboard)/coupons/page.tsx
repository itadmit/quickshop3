'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiTicket } from 'react-icons/hi';
import { DiscountCode } from '@/types/discount';
import { useDebounce } from '@/hooks/useDebounce';

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupons, setSelectedCoupons] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    loadCoupons(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm]);

  const loadCoupons = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Send search to API instead of filtering client-side
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/discounts?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load coupons');
      const data = await response.json();
      setCoupons(data.discounts || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading coupons:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const columns: TableColumn<DiscountCode>[] = [
    {
      key: 'code',
      label: 'קוד',
      render: (coupon) => (
        <div className="font-medium text-gray-900 font-mono">{coupon.code}</div>
      ),
    },
    {
      key: 'discount_type',
      label: 'סוג הנחה',
      render: (coupon) => (
        <span className="text-sm text-gray-700">
          {coupon.discount_type === 'percentage' ? 'אחוזים' :
           coupon.discount_type === 'fixed_amount' ? 'סכום קבוע' :
           'משלוח חינם'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'ערך',
      render: (coupon) => (
        <div className="font-semibold text-gray-900">
          {coupon.discount_type === 'percentage' 
            ? `${coupon.value}%`
            : coupon.discount_type === 'fixed_amount'
            ? `₪${parseFloat(coupon.value || '0').toLocaleString('he-IL')}`
            : 'חינם'}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'סטטוס',
      render: (coupon) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          coupon.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {coupon.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title="קופונים"
      description="נהל קופונים והנחות"
      primaryAction={{
        label: 'קופון חדש',
        onClick: () => router.push('/coupons/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש קופונים..."
      onSearch={setSearchTerm}
      columns={columns}
      data={coupons}
      keyExtractor={(coupon) => coupon.id}
      selectable
      selectedItems={selectedCoupons}
      onSelectionChange={(selected) => setSelectedCoupons(selected as Set<number>)}
      rowActions={(coupon) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/coupons/${coupon.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך"
          >
            <HiPencil className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      onRowClick={(coupon) => router.push(`/coupons/${coupon.id}`)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiTicket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין קופונים</p>
          <button
            onClick={() => router.push('/coupons/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור קופון ראשון
          </button>
        </div>
      }
    />
  );
}

