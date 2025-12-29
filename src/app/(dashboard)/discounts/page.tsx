'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiPencil, HiTrash, HiTag } from 'react-icons/hi';
import { DiscountCode } from '@/types/discount';
import { useDebounce } from '@/hooks/useDebounce';

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
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
      // Send search to API instead of filtering client-side
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      params.append('limit', '50');

      const response = await fetch(`/api/discounts?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load discounts');
      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading discounts:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const deleteDiscount = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקוד הזה?')) return;
    
    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete discount');
      await loadDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('שגיאה במחיקת קוד הנחה');
    }
  };

  const columns: TableColumn<DiscountCode>[] = [
    {
      key: 'code',
      label: 'קוד',
      render: (discount) => (
        <div className="font-medium text-gray-900 font-mono">{discount.code}</div>
      ),
    },
    {
      key: 'discount_type',
      label: 'סוג הנחה',
      render: (discount) => {
        const typeLabels: Record<string, string> = {
          'percentage': 'אחוזים',
          'fixed_amount': 'סכום קבוע',
          'free_shipping': 'משלוח חינם',
          'bogo': 'קנה X קבל Y',
          'bundle': 'חבילה',
          'volume': 'הנחת כמות',
          'fixed_price': 'מחיר קבוע',
          'spend_x_pay_y': 'קנה ב-X שלם Y',
        };
        return (
          <span className="text-sm text-gray-700">
            {typeLabels[discount.discount_type] || discount.discount_type}
          </span>
        );
      },
    },
    {
      key: 'value',
      label: 'ערך',
      render: (discount) => {
        if (discount.discount_type === 'percentage') {
          return (
            <div className="font-semibold text-gray-900">
              {discount.value}%
            </div>
          );
        }
        if (discount.discount_type === 'fixed_amount') {
          return (
            <div className="font-semibold text-gray-900">
              ₪{parseFloat(discount.value || '0').toLocaleString('he-IL')}
            </div>
          );
        }
        if (discount.discount_type === 'free_shipping') {
          return (
            <div className="font-semibold text-gray-900">
              חינם
            </div>
          );
        }
        if (discount.discount_type === 'bogo') {
          const buyQty = discount.buy_quantity || 1;
          const getQty = discount.get_quantity || 1;
          const getDiscountType = discount.get_discount_type || 'free';
          const getDiscountValue = discount.get_discount_value;
          
          let valueText = `קנה ${buyQty} קבל ${getQty}`;
          if (getDiscountType === 'free') {
            valueText += ' חינם';
          } else if (getDiscountType === 'percentage' && getDiscountValue) {
            valueText += ` ב-${getDiscountValue}% הנחה`;
          } else if (getDiscountType === 'fixed_amount' && getDiscountValue) {
            valueText += ` ב-₪${parseFloat(getDiscountValue).toLocaleString('he-IL')}`;
          }
          
          return (
            <div className="font-semibold text-gray-900 text-sm">
              {valueText}
            </div>
          );
        }
        if (discount.discount_type === 'bundle') {
          const minProducts = discount.bundle_min_products || 0;
          const bundleType = discount.bundle_discount_type;
          const bundleValue = discount.bundle_discount_value;
          
          let valueText = `${minProducts}+ מוצרים`;
          if (bundleType === 'percentage' && bundleValue) {
            valueText += ` - ${bundleValue}%`;
          } else if (bundleType === 'fixed_amount' && bundleValue) {
            valueText += ` - ₪${parseFloat(bundleValue).toLocaleString('he-IL')}`;
          }
          
          return (
            <div className="font-semibold text-gray-900 text-sm">
              {valueText}
            </div>
          );
        }
        if (discount.discount_type === 'volume') {
          let tiers = discount.volume_tiers;
          // Parse JSON string if needed
          if (typeof tiers === 'string') {
            try {
              tiers = JSON.parse(tiers);
            } catch (e) {
              tiers = null;
            }
          }
          if (tiers && Array.isArray(tiers) && tiers.length > 0) {
            const firstTier = tiers[0];
            const qty = firstTier.quantity || 0;
            const tierType = firstTier.discount_type;
            const tierValue = firstTier.value;
            
            let valueText = `${qty}+ יחידות`;
            if (tierType === 'percentage') {
              valueText += ` - ${tierValue}%`;
            } else if (tierType === 'fixed_amount') {
              valueText += ` - ₪${tierValue.toLocaleString('he-IL')}`;
            }
            
            return (
              <div className="font-semibold text-gray-900 text-sm">
                {valueText}
              </div>
            );
          }
          return (
            <div className="font-semibold text-gray-900 text-sm">
              הנחת כמות
            </div>
          );
        }
        if (discount.discount_type === 'fixed_price') {
          const qty = discount.fixed_price_quantity || 0;
          const price = discount.fixed_price_amount;
          
          if (qty && price) {
            return (
              <div className="font-semibold text-gray-900 text-sm">
                קנה {qty} פריטים ב-₪{parseFloat(price).toLocaleString('he-IL')}
              </div>
            );
          }
          return (
            <div className="font-semibold text-gray-900 text-sm">
              מחיר קבוע
            </div>
          );
        }
        if (discount.discount_type === 'spend_x_pay_y') {
          const spendAmount = discount.spend_amount;
          const payAmount = discount.pay_amount;
          
          if (spendAmount && payAmount) {
            return (
              <div className="font-semibold text-gray-900 text-sm">
                קנה ב-₪{parseFloat(spendAmount).toLocaleString('he-IL')} שלם ₪{parseFloat(payAmount).toLocaleString('he-IL')}
              </div>
            );
          }
          return (
            <div className="font-semibold text-gray-900 text-sm">
              קנה ב-X שלם Y
            </div>
          );
        }
        return (
          <div className="font-semibold text-gray-900">
            -
          </div>
        );
      },
    },
    {
      key: 'usage_count',
      label: 'שימושים',
      render: (discount) => (
        <div className="text-sm text-gray-600">
          {discount.usage_count} / {discount.usage_limit || '∞'}
        </div>
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
      title="קופונים והנחות"
      description="נהל קודי הנחה וקופונים"
      primaryAction={{
        label: 'קוד הנחה חדש',
        onClick: () => router.push('/discounts/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש קודים..."
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
              router.push(`/discounts/${discount.id}`);
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
          <HiTag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין קודי הנחה</p>
          <button
            onClick={() => router.push('/discounts/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור קוד הנחה ראשון
          </button>
        </div>
      }
    />
  );
}

