'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiHeart } from 'react-icons/hi';

interface WishlistItem {
  id: number;
  customer_id: number;
  product_id: number;
  product_title: string;
  created_at: Date;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWishlist();
  }, [searchTerm]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/wishlist
      setItems([]);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<WishlistItem>[] = [
    {
      key: 'product',
      label: 'מוצר',
      render: (item) => (
        <div className="font-medium text-gray-900">{item.product_title}</div>
      ),
    },
    {
      key: 'customer_id',
      label: 'לקוח',
      render: (item) => (
        <div className="text-sm text-gray-600">ID: {item.customer_id}</div>
      ),
    },
    {
      key: 'created_at',
      label: 'נוסף ב',
      render: (item) => (
        <div className="text-sm text-gray-600">
          {new Date(item.created_at).toLocaleDateString('he-IL')}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="רשימת המתנה"
      description="נהל רשימות המתנה של לקוחות"
      searchPlaceholder="חיפוש ברשימת המתנה..."
      onSearch={setSearchTerm}
      columns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiHeart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">אין פריטים ברשימת המתנה</p>
        </div>
      }
    />
  );
}

