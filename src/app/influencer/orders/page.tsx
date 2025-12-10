'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { InfluencerOrder } from '@/types/influencer';
import Link from 'next/link';

export default function InfluencerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<InfluencerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/influencers/orders?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/influencer/login');
          return;
        }
        throw new Error('Failed to load orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<InfluencerOrder>[] = [
    {
      key: 'order_number',
      label: 'מספר הזמנה',
      render: (order) => (
        <Link
          href={`/influencer/orders/${order.id}`}
          className="font-medium text-green-600 hover:text-green-700"
        >
          #{order.order_number}
        </Link>
      ),
    },
    {
      key: 'created_at',
      label: 'תאריך',
      render: (order) => (
        <div className="text-gray-600">
          {new Date(order.created_at).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'סכום',
      render: (order) => (
        <div className="font-semibold text-gray-900">
          ₪{order.total_amount.toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'coupon_code',
      label: 'קופון',
      render: (order) => (
        <span className="font-mono text-sm text-gray-600">{order.coupon_code}</span>
      ),
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (order) => {
        const statusLabels: Record<string, { label: string; color: string }> = {
          pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-800' },
          paid: { label: 'שולם', color: 'bg-green-100 text-green-800' },
          fulfilled: { label: 'מולא', color: 'bg-blue-100 text-blue-800' },
          cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-800' },
        };
        const status = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable
        title="הזמנות"
        description="כל ההזמנות שנעשו עם הקופונים שלך"
        columns={columns}
        data={orders}
        keyExtractor={(order) => order.id}
        loading={loading}
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          onPageChange: (page) => setPagination({ ...pagination, page }),
        }}
        emptyState={
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">אין הזמנות</p>
          </div>
        }
      />
    </div>
  );
}

