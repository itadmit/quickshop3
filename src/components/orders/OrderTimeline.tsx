'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { HiCheckCircle, HiXCircle, HiClock, HiRefresh, HiBan, HiPlus, HiMail } from 'react-icons/hi';

interface TimelineEvent {
  id: number;
  event_type: string;
  message: string;
  created_at: Date;
  user_id?: number | null;
}

interface OrderTimelineProps {
  orderId: number;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [orderId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      // TODO: Create API endpoint /api/orders/:id/timeline
      // For now, load from system_logs
      const response = await fetch(`/api/orders/${orderId}/timeline`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'order.created':
        return <HiPlus className="w-5 h-5 text-green-500" />;
      case 'order.paid':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'order.fulfilled':
        return <HiCheckCircle className="w-5 h-5 text-blue-500" />;
      case 'order.refunded':
        return <HiRefresh className="w-5 h-5 text-yellow-500" />;
      case 'order.cancelled':
        return <HiBan className="w-5 h-5 text-red-500" />;
      default:
        return <HiClock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית הזמנה</h2>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית הזמנה</h2>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין אירועים להצגה
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{event.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.created_at).toLocaleString('he-IL')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

