'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HiPlus, HiTrash, HiCheckCircle, HiXCircle, HiPencil, HiGlobe } from 'react-icons/hi';
import { WebhookSubscription } from '@/types/webhook';

export default function WebhooksPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    loadSubscriptions(signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const loadSubscriptions = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks/subscriptions', {
        credentials: 'include',
        signal,
      });
      
      if (signal?.aborted) return;
      
      if (!response.ok) throw new Error('Failed to load subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading subscriptions:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const deleteSubscription = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ה-Webhook הזה?')) return;
    
    try {
      const response = await fetch(`/api/webhooks/subscriptions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete subscription');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('שגיאה במחיקת Webhook');
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <Button onClick={() => router.push('/webhooks/new')} className="flex items-center gap-2">
          הוסף Webhook
          <HiPlus className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <HiGlobe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">אין Webhooks מוגדרים</p>
            <Button onClick={() => router.push('/webhooks/new')} className="flex items-center gap-2">
              הוסף Webhook ראשון
              <HiPlus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{subscription.topic}</h3>
                    <p className="text-sm text-gray-500 mt-1">{subscription.address}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      פורמט: {subscription.format} • API Version: {subscription.api_version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/webhooks/${subscription.id}`)}
                    >
                      <HiPencil className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteSubscription(subscription.id)}
                    >
                      <HiTrash className="w-4 h-4 ml-1" />
                      מחק
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

