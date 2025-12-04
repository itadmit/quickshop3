'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiRefresh, HiCheckCircle, HiXCircle } from 'react-icons/hi';

interface Return {
  id: number;
  order_id: number;
  order_name: string;
  customer_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  created_at: Date;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturns, setSelectedReturns] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReturns();
  }, [searchTerm]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/returns
      setReturns([]);
    } catch (error) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<Return>[] = [
    {
      key: 'order',
      label: 'הזמנה',
      render: (returnItem) => (
        <div className="font-medium text-gray-900">{returnItem.order_name}</div>
      ),
    },
    {
      key: 'reason',
      label: 'סיבה',
      render: (returnItem) => (
        <div className="text-sm text-gray-600">{returnItem.reason}</div>
      ),
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (returnItem) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          returnItem.status === 'approved' ? 'bg-green-100 text-green-800' :
          returnItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
          returnItem.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {returnItem.status === 'pending' ? 'ממתין' :
           returnItem.status === 'approved' ? 'אושר' :
           returnItem.status === 'rejected' ? 'נדחה' :
           'הושלם'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'תאריך',
      render: (returnItem) => (
        <div className="text-sm text-gray-600">
          {new Date(returnItem.created_at).toLocaleDateString('he-IL')}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="החזרות והחלפות"
      description="נהל החזרות והחלפות"
      searchPlaceholder="חיפוש החזרות..."
      onSearch={setSearchTerm}
      columns={columns}
      data={returns}
      keyExtractor={(returnItem) => returnItem.id}
      selectable
      selectedItems={selectedReturns}
      onSelectionChange={(selected) => setSelectedReturns(selected as Set<number>)}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiRefresh className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">אין החזרות</p>
        </div>
      }
    />
  );
}

