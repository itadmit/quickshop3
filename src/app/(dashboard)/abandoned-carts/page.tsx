'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiMail, HiShoppingBag } from 'react-icons/hi';

interface AbandonedCart {
  id: number;
  email: string | null;
  customer_id: number | null;
  total_price: string;
  abandoned_at: Date;
  last_activity_at: Date;
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCarts();
  }, [searchTerm]);

  const loadCarts = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/abandoned-carts
      setCarts([]);
    } catch (error) {
      console.error('Error loading abandoned carts:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<AbandonedCart>[] = [
    {
      key: 'email',
      label: 'לקוח',
      render: (cart) => (
        <div>
          <div className="font-medium text-gray-900">{cart.email || 'לקוח אורח'}</div>
          {cart.customer_id && (
            <div className="text-sm text-gray-500">ID: {cart.customer_id}</div>
          )}
        </div>
      ),
    },
    {
      key: 'total_price',
      label: 'סכום',
      render: (cart) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(cart.total_price).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'abandoned_at',
      label: 'נטוש ב',
      render: (cart) => (
        <div className="text-sm text-gray-600">
          {new Date(cart.abandoned_at).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'last_activity',
      label: 'פעילות אחרונה',
      render: (cart) => (
        <div className="text-sm text-gray-600">
          {new Date(cart.last_activity_at).toLocaleString('he-IL')}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="עגלות נטושות"
      description="נהל עגלות נטושות ושלח תזכורות"
      searchPlaceholder="חיפוש עגלות..."
      onSearch={setSearchTerm}
      columns={columns}
      data={carts}
      keyExtractor={(cart) => cart.id}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">אין עגלות נטושות</p>
        </div>
      }
    />
  );
}

