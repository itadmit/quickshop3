'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiEye, HiPencil, HiTrash, HiShoppingCart } from 'react-icons/hi';
import { OrderWithDetails } from '@/types/order';
import { useDebounce } from '@/hooks/useDebounce';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>('');
  const [fulfillmentStatusFilter, setFulfillmentStatusFilter] = useState<string>('');
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

    loadOrders(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, financialStatusFilter, fulfillmentStatusFilter]);

  const loadOrders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (financialStatusFilter) params.append('financial_status', financialStatusFilter);
      if (fulfillmentStatusFilter) params.append('fulfillment_status', fulfillmentStatusFilter);
      params.append('limit', '50');

      const response = await fetch(`/api/orders?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      // Don't update state if request was aborted
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;
      console.error('Error loading orders:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
      case 'voided':
        return 'bg-red-100 text-red-800';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: TableColumn<OrderWithDetails>[] = [
    {
      key: 'order_name',
      label: 'מספר הזמנה',
      render: (order) => (
        <div className="font-medium text-gray-900">
          {order.order_name || `#${order.order_number || order.id}`}
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'לקוח',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">
            {order.name || order.customer?.first_name || 'לקוח אורח'}
          </div>
          {order.email && (
            <div className="text-sm text-gray-500">{order.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'financial_status',
      label: 'סטטוס תשלום',
      render: (order) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.financial_status)}`}>
          {order.financial_status === 'paid' ? 'שולם' :
           order.financial_status === 'pending' ? 'ממתין לתשלום' :
           order.financial_status === 'refunded' ? 'הוחזר' :
           order.financial_status === 'voided' ? 'בוטל' :
           order.financial_status}
        </span>
      ),
    },
    {
      key: 'fulfillment_status',
      label: 'סטטוס ביצוע',
      render: (order) => (
        order.fulfillment_status ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.fulfillment_status)}`}>
            {order.fulfillment_status === 'fulfilled' ? 'בוצע' :
             order.fulfillment_status === 'partial' ? 'חלקי' :
             order.fulfillment_status}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">לא בוצע</span>
        )
      ),
    },
    {
      key: 'total_price',
      label: 'סכום',
      render: (order) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(order.total_price).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'תאריך',
      render: (order) => (
        <div className="text-sm text-gray-600">
          {new Date(order.created_at).toLocaleDateString('he-IL')}
        </div>
      ),
    },
  ];

  const filters = [
    {
      type: 'select' as const,
      label: 'סטטוס תשלום',
      options: [
        { value: '', label: 'הכל' },
        { value: 'pending', label: 'ממתין לתשלום' },
        { value: 'paid', label: 'שולם' },
        { value: 'refunded', label: 'הוחזר' },
        { value: 'voided', label: 'בוטל' },
      ],
      value: financialStatusFilter,
      onChange: (value: string) => setFinancialStatusFilter(value),
    },
    {
      type: 'select' as const,
      label: 'סטטוס ביצוע',
      options: [
        { value: '', label: 'הכל' },
        { value: 'fulfilled', label: 'בוצע' },
        { value: 'partial', label: 'חלקי' },
        { value: 'restocked', label: 'הוחזר למלאי' },
      ],
      value: fulfillmentStatusFilter,
      onChange: (value: string) => setFulfillmentStatusFilter(value),
    },
  ];

  return (
    <DataTable
      title="הזמנות"
      description="נהל ועקוב אחר כל ההזמנות שלך"
      primaryAction={{
        label: 'הזמנה חדשה',
        onClick: () => router.push('/orders/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש הזמנות..."
      onSearch={setSearchTerm}
      filters={filters}
      columns={columns}
      data={orders}
      keyExtractor={(order) => order.id}
      selectable
      selectedItems={selectedOrders}
      onSelectionChange={(selected) => setSelectedOrders(selected as Set<number>)}
      rowActions={(order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/orders/${order.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בפרטים"
          >
            <HiEye className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      onRowClick={(order) => router.push(`/orders/${order.id}`)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין הזמנות להצגה</p>
          <button
            onClick={() => router.push('/orders/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור הזמנה חדשה
          </button>
        </div>
      }
    />
  );
}
