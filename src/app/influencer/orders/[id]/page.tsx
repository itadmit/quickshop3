'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi';

export default function InfluencerOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/influencers/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/influencer/login');
          return;
        }
        if (response.status === 404) {
          router.push('/influencer/orders');
          return;
        }
        throw new Error('Failed to load order');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-gray-200 rounded"></div>
        <Card>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">הזמנה לא נמצאה</p>
        <Link href="/influencer/orders" className="text-green-600 hover:text-green-700 font-medium">
          חזרה לרשימת הזמנות
        </Link>
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'שולם', color: 'bg-green-100 text-green-800' },
    fulfilled: { label: 'מולא', color: 'bg-blue-100 text-blue-800' },
    cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-800' },
  };
  const status = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הזמנה #{order.order_number}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(order.created_at).toLocaleDateString('he-IL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Link
          href="/influencer/orders"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <HiArrowRight className="w-5 h-5" />
          חזרה לרשימה
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פריטים</h2>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_title}</p>
                    <p className="text-sm text-gray-600">כמות: {item.quantity}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      ₪{item.total.toLocaleString('he-IL')}
                    </p>
                    <p className="text-xs text-gray-500">₪{item.price.toLocaleString('he-IL')} לפריט</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">סיכום</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">קופון שנוצל:</span>
                <span className="font-mono font-medium text-gray-900">{order.coupon_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">הנחה:</span>
                <span className="font-medium text-green-600">
                  -₪{order.discount_amount.toLocaleString('he-IL')}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">סה"כ:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₪{order.total_amount.toLocaleString('he-IL')}
                  </span>
                </div>
              </div>
              <div className="pt-3">
                <span className="text-sm text-gray-600">סטטוס:</span>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}



