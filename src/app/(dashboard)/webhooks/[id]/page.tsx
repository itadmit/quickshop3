'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiSave, HiX, HiTrash, HiPlay, HiRefresh, HiClock } from 'react-icons/hi';
import { useOptimisticToast } from '@/hooks/useOptimisticToast';
import { WebhookSubscription } from '@/types/webhook';

export default function WebhookDetailsPage() {
  const { toast } = useOptimisticToast();
  const params = useParams();
  const router = useRouter();
  const webhookId = params.id as string;
  const isNew = webhookId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    topic: 'order.created',
    is_active: true,
  });

  useEffect(() => {
    if (!isNew && webhookId) {
      loadWebhook();
      loadDeliveries();
    }
  }, [webhookId, isNew]);

  const loadWebhook = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/webhooks/subscriptions/${webhookId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load webhook');
      const data = await response.json();
      const webhook = data.subscription;
      setFormData({
        url: webhook.address || '',
        topic: webhook.topic || 'order.created',
        is_active: true, // WebhookSubscription doesn't have is_active field
      });
    } catch (error) {
      console.error('Error loading webhook:', error);
      alert('שגיאה בטעינת ה-Webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const url = isNew ? '/api/webhooks/subscriptions' : `/api/webhooks/subscriptions/${webhookId}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address: formData.url,
          topic: formData.topic,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save webhook');
      }

      router.push('/webhooks');
    } catch (error: any) {
      console.error('Error saving webhook:', error);
      alert(error.message || 'שגיאה בשמירת ה-Webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ה-Webhook?')) return;
    
    try {
      const response = await fetch(`/api/webhooks/subscriptions/${webhookId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete webhook');
      toast({
        title: 'הצלחה',
        description: 'ה-Webhook נמחק בהצלחה',
      });
      router.push('/webhooks');
    } catch (error: any) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה במחיקת ה-Webhook',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const response = await fetch(`/api/webhooks/subscriptions/${webhookId}/test`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'הצלחה',
          description: data.message || 'ה-Webhook נשלח בהצלחה',
        });
      } else {
        toast({
          title: 'שגיאה',
          description: data.error || 'שגיאה בשליחת ה-Webhook',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשליחת ה-Webhook',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const response = await fetch(`/api/webhooks/subscriptions/${webhookId}/deliveries?limit=20`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleRetry = async (eventId: number) => {
    try {
      const response = await fetch(`/api/webhooks/events/${eventId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'הצלחה',
          description: 'ה-Webhook נשלח שוב בהצלחה',
        });
        await loadDeliveries();
      } else {
        toast({
          title: 'שגיאה',
          description: data.error || 'שגיאה בשליחה חוזרת',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'שגיאה בשליחה חוזרת',
        variant: 'destructive',
      });
    }
  };

  const topics = [
    { value: 'order.created', label: 'הזמנה נוצרה' },
    { value: 'order.updated', label: 'הזמנה עודכנה' },
    { value: 'order.paid', label: 'הזמנה שולמה' },
    { value: 'order.fulfilled', label: 'הזמנה בוצעה' },
    { value: 'order.cancelled', label: 'הזמנה בוטלה' },
    { value: 'order.refunded', label: 'הזמנה הוחזרה' },
    { value: 'product.created', label: 'מוצר נוצר' },
    { value: 'product.updated', label: 'מוצר עודכן' },
    { value: 'product.deleted', label: 'מוצר נמחק' },
    { value: 'customer.created', label: 'לקוח נוצר' },
    { value: 'customer.updated', label: 'לקוח עודכן' },
    { value: '*', label: 'כל האירועים' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Webhook חדש' : 'עריכת Webhook'}
        </h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button 
                variant="ghost" 
                onClick={handleTest}
                disabled={testing}
                className="text-blue-600"
              >
                <HiPlay className="w-5 h-5 ml-2" />
                {testing ? 'בודק...' : 'בדוק Webhook'}
              </Button>
              <Button variant="ghost" onClick={handleDelete} className="text-red-600">
                <HiTrash className="w-5 h-5 ml-2" />
                מחק
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => router.back()}>
            <HiX className="w-5 h-5 ml-2" />
            ביטול
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/webhook"
                dir="ltr"
                className="text-left"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                כתובת URL שתקבל את האירועים
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נושא אירוע *
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                {topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </Card>

        {!isNew && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiClock className="w-5 h-5" />
                  היסטוריית משלוחים
                </h2>
                <Button variant="ghost" size="sm" onClick={loadDeliveries}>
                  <HiRefresh className="w-4 h-4 ml-1" />
                  רענן
                </Button>
              </div>
              
              {loadingDeliveries ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : deliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  אין משלוחים להצגה
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{delivery.topic}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(delivery.created_at).toLocaleString('he-IL')}
                        </div>
                        {delivery.last_error && (
                          <div className="text-xs text-red-600 mt-1">{delivery.last_error}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            delivery.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : delivery.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {delivery.status === 'sent' ? 'נשלח' : delivery.status === 'failed' ? 'נכשל' : 'ממתין'}
                        </span>
                        {delivery.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(delivery.id)}
                          >
                            <HiRefresh className="w-4 h-4 ml-1" />
                            נסה שוב
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </form>
    </div>
  );
}

