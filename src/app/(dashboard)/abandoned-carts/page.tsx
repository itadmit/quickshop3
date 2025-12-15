'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { HiShoppingBag, HiEye, HiLink, HiCheck, HiExternalLink } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';

interface OrderLineItem {
  id: number;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
  image_url?: string;
}

interface AbandonedOrder {
  id: number;
  order_name: string | null;
  order_number: number | null;
  order_handle: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  customer_id: number | null;
  total_price: string;
  currency: string;
  financial_status: string;
  created_at: Date;
  updated_at: Date;
  line_items?: OrderLineItem[];
}

interface StoreInfo {
  slug: string;
  name: string;
  abandonedCartTimeoutHours: number;
}

export default function AbandonedCartsPage() {
  const router = useRouter();
  const { toast } = useOptimisticToast();
  const [orders, setOrders] = useState<AbandonedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AbandonedOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [timeoutHours, setTimeoutHours] = useState(4); // Default 4 hours

  useEffect(() => {
    loadStoreInfo();
  }, []);

  useEffect(() => {
    if (storeInfo) {
      loadOrders();
    }
  }, [searchTerm, storeInfo]);

  const loadStoreInfo = async () => {
    try {
      const response = await fetch('/api/settings/store', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (data.store) {
          const settings = data.store.settings || {};
          const timeout = settings.abandonedCartTimeoutHours || 4;
          setTimeoutHours(timeout);
          setStoreInfo({ 
            slug: data.store.slug, 
            name: data.store.name,
            abandonedCartTimeoutHours: timeout 
          });
        }
      }
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Fetch orders with financial_status = 'pending' (waiting for payment)
      const params = new URLSearchParams({
        financial_status: 'pending',
        limit: '50',
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      
      // Filter orders older than the timeout setting
      const now = new Date();
      const filteredOrders = (data.orders || []).filter((order: AbandonedOrder) => {
        const createdAt = new Date(order.created_at);
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation >= timeoutHours;
      });
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading abandoned orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCheckoutLink = (order: AbandonedOrder): string => {
    if (!storeInfo || !order.order_handle) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/${storeInfo.slug}/checkout/success?order=${order.order_handle}`;
  };

  const handleCopyLink = async (order: AbandonedOrder) => {
    // For orders without order_handle, generate a direct link to the order page
    const link = order.order_handle 
      ? getCheckoutLink(order)
      : `${typeof window !== 'undefined' ? window.location.origin : ''}/orders/${order.id}`;
    
    if (!link) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור קישור',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(order.id);
      toast({
        title: 'הקישור הועתק',
        description: order.order_handle 
          ? 'קישור לתשלום הועתק ללוח' 
          : 'קישור להזמנה הועתק ללוח',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להעתיק את הקישור',
        variant: 'destructive',
      });
    }
  };

  const handleViewOrder = (order: AbandonedOrder) => {
    router.push(`/orders/${order.id}`);
  };

  const getTimeSinceCreation = (date: Date): string => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `לפני ${diffDays} ימים`;
    } else if (diffHours > 0) {
      return `לפני ${diffHours} שעות`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `לפני ${diffMinutes} דקות`;
    }
  };

  const columns: TableColumn<AbandonedOrder>[] = [
    {
      key: 'order_name',
      label: 'הזמנה',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">{order.order_name || `#${order.order_number}`}</div>
          <div className="text-sm text-gray-500">{getTimeSinceCreation(order.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'לקוח',
      render: (order) => (
        <div>
          <div className="font-medium text-gray-900">{order.name || 'לקוח אורח'}</div>
          {order.email && (
            <div className="text-sm text-gray-500">{order.email}</div>
          )}
          {order.phone && !order.email && (
            <div className="text-sm text-gray-500">{order.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'total_price',
      label: 'סכום',
      render: (order) => (
        <div className="font-semibold text-gray-900">
          ₪{parseFloat(order.total_price || '0').toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'נוצר ב',
      render: (order) => (
        <div className="text-sm text-gray-600">
          {new Date(order.created_at).toLocaleString('he-IL')}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: () => (
        <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          ממתין לתשלום
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title="עגלות נטושות"
      description={`הזמנות שממתינות לתשלום מעל ${timeoutHours} שעות`}
      searchPlaceholder="חיפוש הזמנות..."
      onSearch={setSearchTerm}
      columns={columns}
      data={orders}
      keyExtractor={(order) => order.id}
      rowActions={(order) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(order);
            }}
            className="p-2"
            title="צפה בהזמנה"
          >
            <HiEye className="w-5 h-5 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink(order);
            }}
            className="p-2"
            title="העתק קישור להזמנה"
          >
            {copiedId === order.id ? (
              <HiCheck className="w-5 h-5 text-green-600" />
            ) : (
              <HiLink className="w-5 h-5 text-gray-600" />
            )}
          </Button>
        </div>
      )}
      onRowClick={handleViewOrder}
      loading={loading}
      emptyState={
        <div className="text-center py-12">
          <HiShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">אין עגלות נטושות</p>
          <p className="text-sm text-gray-400">כל ההזמנות שולמו בהצלחה 🎉</p>
        </div>
      }
    />
  );
}
