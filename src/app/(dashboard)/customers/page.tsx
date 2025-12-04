'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiPlus, HiEye, HiPencil, HiUsers } from 'react-icons/hi';
import { CustomerWithDetails } from '@/types/customer';
import { useDebounce } from '@/hooks/useDebounce';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
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

    loadCustomers(signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm]);

  const loadCustomers = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      params.append('limit', '50');

      const response = await fetch(`/api/customers?${params.toString()}`, {
        credentials: 'include',
        signal,
      });
      
      // Don't update state if request was aborted
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load customers');
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') return;
      console.error('Error loading customers:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const columns: TableColumn<CustomerWithDetails>[] = [
    {
      key: 'name',
      label: 'שם',
      render: (customer) => (
        <div className="font-medium text-gray-900">
          {customer.first_name || customer.last_name
            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
            : 'לקוח ללא שם'}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'אימייל',
      render: (customer) => (
        <div className="text-gray-900">{customer.email || '-'}</div>
      ),
    },
    {
      key: 'phone',
      label: 'טלפון',
      render: (customer) => (
        <div className="text-gray-900">{customer.phone || '-'}</div>
      ),
    },
    {
      key: 'orders_count',
      label: 'הזמנות',
      render: (customer) => (
        <div className="text-gray-900">{customer.orders_count || 0}</div>
      ),
    },
    {
      key: 'total_spent',
      label: 'סה"כ הוצאות',
      render: (customer) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(customer.total_spent || '0').toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'state',
      label: 'סטטוס',
      render: (customer) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          customer.state === 'enabled' ? 'bg-green-100 text-green-800' :
          customer.state === 'disabled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {customer.state === 'enabled' ? 'פעיל' :
           customer.state === 'disabled' ? 'מושבת' :
           customer.state === 'invited' ? 'הוזמן' :
           customer.state}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title="לקוחות"
      description="נהל ועקוב אחר כל הלקוחות שלך"
      primaryAction={{
        label: 'לקוח חדש',
        onClick: () => router.push('/customers/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש לקוחות..."
      onSearch={setSearchTerm}
      columns={columns}
      data={customers}
      keyExtractor={(customer) => customer.id}
      selectable
      selectedItems={selectedCustomers}
      onSelectionChange={(selected) => setSelectedCustomers(selected as Set<number>)}
      rowActions={(customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/customers/${customer.id}`);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בפרטים"
          >
            <HiEye className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין לקוחות להצגה</p>
          <button
            onClick={() => router.push('/customers/new')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            צור לקוח חדש
          </button>
        </div>
      }
    />
  );
}

