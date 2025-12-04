'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HiSave, HiX, HiTrash } from 'react-icons/hi';
import { WebhookSubscription } from '@/types/webhook';

export default function WebhookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const webhookId = params.id as string;
  const isNew = webhookId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    topic: 'order.created',
    is_active: true,
  });

  useEffect(() => {
    if (!isNew && webhookId) {
      loadWebhook();
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
      router.push('/webhooks');
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('שגיאה במחיקת ה-Webhook');
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
            <Button variant="ghost" onClick={handleDelete} className="text-red-600">
              <HiTrash className="w-5 h-5 ml-2" />
              מחק
            </Button>
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

