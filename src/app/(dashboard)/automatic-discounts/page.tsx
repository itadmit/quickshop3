'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiSparkles } from 'react-icons/hi';
import { AutomaticDiscount } from '@/types/discount';
import { useDebounce } from '@/hooks/useDebounce';

export default function AutomaticDiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<AutomaticDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscounts, setSelectedDiscounts] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
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

    loadDiscounts(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, activeFilter]);

  const loadDiscounts = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter) params.append('is_active', activeFilter);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await fetch(`/api/automatic-discounts?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load automatic discounts');
      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading automatic discounts:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const deleteDiscount = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההנחה האוטומטית הזו?')) return;
    
    try {
      const response = await fetch(`/api/automatic-discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete automatic discount');
      await loadDiscounts();
    } catch (error) {
      console.error('Error deleting automatic discount:', error);
      alert('שגיאה במחיקת הנחה אוטומטית');
    }
  };

  const columns: TableColumn<AutomaticDiscount>[] = [
    {
      key: 'name',
      label: 'שם',
      render: (discount) => (
        <div className="font-medium text-gray-900">{discount.name}</div>
      ),
    },
    {
      key: 'discount_type',
      label: 'סוג הנחה',
      render: (discount) => (
        <span className="text-sm text-gray-700">
          {discount.discount_type === 'percentage' ? 'אחוזים' :
           discount.discount_type === 'fixed_amount' ? 'סכום קבוע' :
           'משלוח חינם'}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'ערך',
      render: (discount) => (
        <div className="font-semibold text-gray-900">
          {discount.discount_type === 'percentage' 
            ? `${discount.value}%`
            : discount.discount_type === 'fixed_amount'
            ? `₪${parseFloat(discount.value || '0').toLocaleString('he-IL')}`
            : 'חינם'}
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'עדיפות',
      render: (discount) => (
        <div className="text-sm text-gray-600">
          {discount.priority || 0}
        </div>
      ),
    },
    {
      key: 'applies_to',
      label: 'חל על',
      render: (discount) => (
        <span className="text-sm text-gray-600">
          {discount.applies_to === 'all' ? 'כל המוצרים' :
           discount.applies_to === 'specific_products' ? 'מוצרים ספציפיים' :
           discount.applies_to === 'specific_collections' ? 'קטגוריות' :
           'תגיות'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'סטטוס',
      render: (discount) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          discount.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {discount.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      ),
    },
    {
      key: 'ends_at',
      label: 'תוקף',
      render: (discount) => (
        <div className="text-sm text-gray-600">
          {discount.ends_at
            ? new Date(discount.ends_at).toLocaleDateString('he-IL')
            : 'ללא הגבלה'}
        </div>
      ),
    },
  ];

  const filters = [
    {
      type: 'select' as const,
      label: 'סטטוס',
      options: [
        { value: '', label: 'הכל' },
        { value: 'true', label: 'פעיל' },
        { value: 'false', label: 'לא פעיל' },
      ],
      value: activeFilter,
      onChange: (value: string) => setActiveFilter(value),
    },
  ];

  return (
    <DataTable
      title="הנחות אוטומטיות"
      description="נהל הנחות שמוחלות אוטומטית ללא קוד קופון"
      primaryAction={{
        label: 'הנחה אוטומטית חדשה',
        onClick: () => router.push('/automatic-discounts/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש הנחות..."
      onSearch={setSearchTerm}
      filters={filters}
      columns={columns}
      data={discounts}
      keyExtractor={(discount) => discount.id}
      selectable
      selectedItems={selectedDiscounts}
      onSelectionChange={(selected) => setSelectedDiscounts(selected as Set<number>)}
      rowActions={(discount) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/automatic-discounts/${discount.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="ערוך"
          >
            <HiPencil className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteDiscount(discount.id);
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק"
          >
            <HiTrash className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiSparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין הנחות אוטומטיות</p>
          <button
            onClick={() => router.push('/automatic-discounts/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור הנחה אוטומטית ראשונה
          </button>
        </div>
      }
    />
  );
}

