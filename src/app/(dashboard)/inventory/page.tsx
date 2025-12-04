'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiCube } from 'react-icons/hi';

interface InventoryItem {
  id: number;
  product_title: string;
  variant_title: string | null;
  sku: string | null;
  available: number;
  committed: number;
  incoming: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventory();
  }, [searchTerm]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/inventory
      // For now, show empty state
      setItems([]);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<InventoryItem>[] = [
    {
      key: 'product',
      label: 'מוצר',
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">{item.product_title}</div>
          {item.variant_title && (
            <div className="text-sm text-gray-500">{item.variant_title}</div>
          )}
          {item.sku && (
            <div className="text-xs text-gray-400">SKU: {item.sku}</div>
          )}
        </div>
      ),
    },
    {
      key: 'available',
      label: 'זמין',
      render: (item) => (
        <div className="font-semibold text-gray-900">{item.available}</div>
      ),
    },
    {
      key: 'committed',
      label: 'מחויב',
      render: (item) => (
        <div className="text-gray-600">{item.committed}</div>
      ),
    },
    {
      key: 'incoming',
      label: 'בדרך',
      render: (item) => (
        <div className="text-gray-600">{item.incoming}</div>
      ),
    },
  ];

  return (
    <DataTable
      title="מלאי"
      description="נהל מלאי מוצרים"
      searchPlaceholder="חיפוש במלאי..."
      onSearch={setSearchTerm}
      columns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiCube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">אין פריטי מלאי להצגה</p>
        </div>
      }
    />
  );
}

