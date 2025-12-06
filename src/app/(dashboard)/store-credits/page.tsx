'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { HiCreditCard, HiPlus } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

interface StoreCredit {
  id: number;
  customer_id: number;
  customer_name: string;
  balance: string;
  expires_at: Date | null;
  created_at: Date;
}

export default function StoreCreditsPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCredits();
  }, [searchTerm]);

  const loadCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store-credits');
      if (!response.ok) throw new Error('Failed to load store credits');
      const data = await response.json();
      
      // Fetch customer names for each credit
      const creditsWithNames = await Promise.all(
        (data.store_credits || []).map(async (credit: any) => {
          if (credit.customer_id) {
            try {
              const customerRes = await fetch(`/api/customers/${credit.customer_id}`);
              if (customerRes.ok) {
                const customerData = await customerRes.json();
                return {
                  ...credit,
                  customer_name: `${customerData.customer?.first_name || ''} ${customerData.customer?.last_name || ''}`.trim() || `לקוח #${credit.customer_id}`,
                };
              }
            } catch (e) {
              // Ignore errors
            }
          }
          return {
            ...credit,
            customer_name: `לקוח #${credit.customer_id || 'אורח'}`,
          };
        })
      );
      
      setCredits(creditsWithNames);
    } catch (error) {
      console.error('Error loading store credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<StoreCredit>[] = [
    {
      key: 'customer',
      label: 'לקוח',
      render: (credit) => (
        <div className="font-medium text-gray-900">{credit.customer_name}</div>
      ),
    },
    {
      key: 'balance',
      label: 'יתרה',
      render: (credit) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(credit.balance).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'expires_at',
      label: 'תוקף',
      render: (credit) => (
        <div className="text-sm text-gray-600">
          {credit.expires_at
            ? new Date(credit.expires_at).toLocaleDateString('he-IL')
            : 'ללא הגבלה'}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      title="קרדיט בחנות"
      description="נהל קרדיטים של לקוחות"
      primaryAction={{
        label: 'הוסף קרדיט',
        onClick: () => router.push('/store-credits/new'),
        icon: <HiPlus className="w-4 h-4" />,
      }}
      searchPlaceholder="חיפוש קרדיטים..."
      onSearch={setSearchTerm}
      columns={columns}
      data={credits}
      keyExtractor={(credit) => credit.id}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiCreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">אין קרדיטים</p>
        </div>
      }
    />
  );
}

